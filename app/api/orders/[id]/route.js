import mongoose from 'mongoose';
import { handler, ok, HttpError } from '@/lib/api';
import { Order, User, Review } from '@/lib/models';
import { distanceKm } from '@/lib/geo';
import { releaseCoupon } from '@/lib/coupons';
import { push, autoAssign, releasePayout, refund, freeRider, freeRiderById } from '@/lib/orderflow';
export const dynamic = 'force-dynamic';

async function load(id, user) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError('Not found', 404);
  const o = await Order.findById(id).populate('restaurant', 'name address location owner image').populate('rider', 'name phone rider.location rider.vehicle rider.updatedAt').populate('customer', 'name phone');
  if (!o) throw new HttpError('Not found', 404);
  const rid = String(o.restaurant?._id);
  const mine = { customer: String(o.customer?._id) === String(user._id), admin: true,
    restaurant: String(user.restaurant) === rid, rider: String(o.rider?._id) === String(user._id) }[user.role];
  if (!mine) throw new HttpError('Forbidden', 403);
  return o;
}

export const GET = handler(async (_r, { params, user }) => {
  const o = (await load(params.id, user)).toObject();
  if (user.role === 'customer' || user.role === 'rider') { delete o.commission; delete o.restaurantShare; }
  if (o.group) o.siblings = await Order.find({ group: o.group, _id: { $ne: o._id } }).select('status restaurant').populate('restaurant', 'name').lean(); // other restaurants paid in the same checkout
  if (o.reviewed && user.role === 'customer') o.review = await Review.findOne({ order: o._id }).lean();
  return ok({ order: o });
}, []);

export const PATCH = handler(async (req, { params, user }) => {
  const o = await load(params.id, user);
  const { action, riderId } = await req.json();
  const s = o.status, role = user.role;
  const need = (...a) => { if (!a.includes(s)) throw new HttpError(`Not allowed while order is ${s}`); };
  const cancel = async () => { if (s !== 'pending_payment') await releaseCoupon(o); push(o, 'cancelled'); await refund(o); await freeRider(o); };

  if (role === 'restaurant') {
    if (action === 'accept') { need('placed'); push(o, 'accepted'); await o.save(); await autoAssign(o); return ok({ order: o }); }
    else if (action === 'preparing') { need('accepted'); push(o, 'preparing'); }
    else if (action === 'ready') { need('preparing'); push(o, 'ready'); }
    else if (action === 'reject') { need('placed', 'accepted'); await cancel(); }
    else throw new HttpError('Invalid action');
  } else if (role === 'rider') {
    if (action === 'pickup') { need('ready'); push(o, 'picked_up'); }
    else if (action === 'deliver') {
      need('picked_up');
      // batched delivery: collect every order going to this address before dropping any of them
      const same = await Order.find({ rider: user._id, _id: { $ne: o._id }, status: { $in: ['accepted', 'preparing', 'ready'] } }).select('address.location');
      if (same.some((x) => x.address?.location?.coordinates && distanceKm(x.address.location.coordinates, o.address.location.coordinates) <= 0.15)) throw new HttpError('Pick up your other order(s) for this address first');
      push(o, 'delivered'); if (o.payment.method === 'cod') o.payment.status = 'paid'; await releasePayout(o); await freeRider(o); }
    else throw new HttpError('Invalid action');
  } else if (role === 'customer') {
    if (action !== 'cancel') throw new HttpError('Invalid action');
    need('placed'); await cancel();
  } else if (role === 'admin') {
    if (action === 'assign') {
      if (['delivered', 'cancelled'].includes(s)) throw new HttpError('Order closed');
      const rider = await User.findOne({ _id: riderId, role: 'rider', approved: true });
      if (!rider) throw new HttpError('Rider not found');
      const prev = o.rider?._id;
      o.rider = rider._id; await User.updateOne({ _id: rider._id }, { $set: { 'rider.busy': true } });
      if (prev && String(prev) !== String(rider._id)) await freeRiderById(prev, o._id);
    } else if (action === 'auto') { if (!(await autoAssign(o))) throw new HttpError('No idle rider nearby'); return ok({ order: o }); }
    else if (action === 'cancel') { need('placed', 'accepted', 'preparing', 'ready'); await cancel(); }
    else throw new HttpError('Invalid action');
  }
  await o.save();
  return ok({ order: o });
}, []);
