import { Order, Restaurant, User, Address } from './models';
import { rzp } from './razorpay';
import { distanceKm } from './geo';
import { redeemCoupon } from './coupons';

export const push = (o, status) => { o.status = status; o.timeline.push({ status }); };

// A new address typed at checkout is saved (and made the default) only once the order has succeeded,
// and every order of the same checkout is linked to it. Idempotent: safe to call for each order of a group.
export async function commitAddress(order) {
  const fresh = await Order.findById(order._id).select('pendingAddress addressId');
  if (!fresh) return;
  if (fresh.addressId && !fresh.pendingAddress) { order.addressId = fresh.addressId; order.pendingAddress = undefined; return; }
  if (!fresh.pendingAddress) return;
  const userId = order.customer;
  try {
    if ((await Address.countDocuments({ user: userId })) >= 15) throw new Error('address limit');
    await Address.updateMany({ user: userId }, { isDefault: false });
    const a = await Address.create({ ...fresh.pendingAddress, user: userId, isDefault: true });
    const q = order.group ? { group: order.group } : { _id: order._id };
    await Order.updateMany(q, { $set: { addressId: a._id }, $unset: { pendingAddress: 1 } });
    order.addressId = a._id;
  } catch (e) { console.error('save address failed', e.message); await Order.updateMany(order.group ? { group: order.group } : { _id: order._id }, { $unset: { pendingAddress: 1 } }); }
  order.pendingAddress = undefined;
}

// Called after verified payment (client verify + webhook; idempotent)
export async function markPaid(order, paymentId) {
  if (order.payment.status === 'paid') return order;
  order.payment.status = 'paid'; order.payment.rzpPaymentId = paymentId;
  if (order.status === 'pending_payment') { push(order, 'placed'); await redeemCoupon(order); }
  await commitAddress(order);
  const r = await Restaurant.findById(order.restaurant);
  if (r?.linkedAccountId) {
    try { // hold the restaurant's share until delivery
      const res = await rzp(`/v1/payments/${paymentId}/transfers`, 'POST', { transfers: [{
        account: r.linkedAccountId, amount: Math.round(order.restaurantShare * 100), currency: 'INR',
        notes: { orderId: String(order._id) }, on_hold: true }] });
      order.payment.transferId = res.items?.[0]?.id; order.payment.payout = 'held';
    } catch (e) { console.error('transfer failed', e.message); order.payment.payout = 'manual_due'; }
  } else order.payment.payout = 'manual_due';
  await order.save();
  return order;
}

export async function releasePayout(order) {
  if (order.payment.method === 'cod' || order.payment.payout === 'manual_due') { order.payment.payout = 'manual_due'; return; }
  if (order.payment.payout === 'held' && order.payment.transferId) {
    try { await rzp(`/v1/transfers/${order.payment.transferId}`, 'PATCH', { on_hold: false }); order.payment.payout = 'released'; }
    catch (e) { console.error('release failed', e.message); order.payment.payout = 'manual_due'; }
  }
}

export async function refund(order) {
  if (order.payment.method === 'online' && order.payment.status === 'paid' && order.payment.rzpPaymentId) {
    try {
      if (order.payment.transferId) await rzp(`/v1/payments/${order.payment.rzpPaymentId}/refund`, 'POST', { amount: Math.round(order.total * 100), reverse_all: 1 });
      else await rzp(`/v1/payments/${order.payment.rzpPaymentId}/refund`, 'POST', { amount: Math.round(order.total * 100) });
      order.payment.status = 'refunded'; order.payment.payout = 'none';
    } catch (e) { console.error('refund failed', e.message); }
  }
}

// A rider stays busy while any other undelivered order is still assigned to them (batched deliveries)
export async function freeRiderById(riderId, exceptOrderId) {
  if (!riderId) return;
  const more = await Order.exists({ rider: riderId, _id: { $ne: exceptOrderId }, status: { $in: ['accepted', 'preparing', 'ready', 'picked_up'] } });
  if (!more) await User.updateOne({ _id: riderId }, { $set: { 'rider.busy': false } });
}
export const freeRider = (order) => freeRiderById(order.rider?._id || order.rider, order._id);

const BATCH_DROP_KM = 0.15;   // drop points this close count as "the same address"
const BATCH_PICKUP_KM = 4;    // the extra restaurant must be this close to a pickup the rider already has
const MAX_BATCH = 3;          // orders one rider carries at once
// Find an online rider who already has an order (not yet picked up) going to the same address, with a
// pickup restaurant near this one — so one rider collects from every restaurant on the way.
export async function findBatchRider(order, rest) {
  const dest = order.address?.location?.coordinates; if (!dest || !rest?.location?.coordinates) return null;
  const mine = await Order.find({ rider: { $ne: null }, status: { $in: ['accepted', 'preparing', 'ready'] }, _id: { $ne: order._id } }).populate('restaurant', 'location').select('rider restaurant address.location');
  const byRider = new Map();
  for (const o of mine) {
    if (!o.address?.location?.coordinates || !o.restaurant?.location?.coordinates) continue;
    if (distanceKm(o.address.location.coordinates, dest) > BATCH_DROP_KM) continue;
    const k = String(o.rider); const e = byRider.get(k) || { n: 0, near: false };
    e.n++; if (distanceKm(o.restaurant.location.coordinates, rest.location.coordinates) <= BATCH_PICKUP_KM) e.near = true; byRider.set(k, e);
  }
  for (const [rid, e] of byRider) {
    if (!e.near || e.n >= MAX_BATCH) continue;
    const rider = await User.findOne({ _id: rid, role: 'rider', approved: true, 'rider.online': true });
    if (rider) return rider;
  }
  return null;
}

// 1) batch onto a rider already heading to this address, else 2) atomically claim the nearest online, idle rider (within 8 km of the restaurant)
export async function autoAssign(order) {
  if (order.rider) return null;
  const r = await Restaurant.findById(order.restaurant);
  const batch = await findBatchRider(order, r);
  if (batch) { order.rider = batch._id; await order.save(); return batch; }
  const rider = await User.findOneAndUpdate(
    { role: 'rider', approved: true, 'rider.online': true, 'rider.busy': false,
      'rider.location': { $near: { $geometry: r.location, $maxDistance: 8000 } } },
    { $set: { 'rider.busy': true } }, { new: true });
  if (!rider) return null;
  order.rider = rider._id; await order.save();
  return rider;
}

// When a rider comes online/moves, give them the nearest unassigned order
export async function tryAssignForRider(rider) {
  if (!rider.rider?.online || rider.rider.busy || !rider.rider.location?.coordinates) return;
  const open = await Order.find({ rider: null, status: { $in: ['accepted', 'preparing', 'ready'] } }).populate('restaurant', 'location').limit(20);
  const near = open.map((o) => ({ o, d: distanceKm(rider.rider.location.coordinates, o.restaurant.location.coordinates) }))
    .filter((x) => x.d <= 8).sort((a, b) => a.d - b.d)[0];
  if (!near) return;
  const claimed = await Order.findOneAndUpdate({ _id: near.o._id, rider: null }, { rider: rider._id });
  if (claimed) await User.updateOne({ _id: rider._id }, { $set: { 'rider.busy': true } });
}
