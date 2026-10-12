import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import { handler, ok, num, str, geoPoint, HttpError } from '@/lib/api';
import { Order, Restaurant, MenuItem } from '@/lib/models';
import { priceOrder } from '@/lib/pricing';
import { redeemCoupon } from '@/lib/coupons';
import { commitAddress } from '@/lib/orderflow';
import { clean as cleanAddress } from '@/lib/addr';
import { rzp } from '@/lib/razorpay';
export const dynamic = 'force-dynamic';

export const GET = handler(async (_req, { user }) => {
  const q = user.role === 'admin' ? {} : { customer: user._id, status: { $ne: 'pending_payment' } };
  return ok({ orders: await Order.find(q).sort('-createdAt').limit(50).populate('restaurant', 'name image').lean() });
}, ['customer', 'admin']);

// Build one restaurant's order lines + pricing (each restaurant has its own coupon, delivery fee and taxes)
async function build(spec, dest, userId, soft) {
  if (!mongoose.isValidObjectId(spec?.restaurantId)) throw new HttpError('Invalid restaurant');
  const r = await Restaurant.findOne({ _id: spec.restaurantId, approved: true });
  if (!r || !r.isOpen) throw new HttpError(`${r?.name || 'This restaurant'} is not accepting orders right now`);
  const wanted = Array.isArray(spec.items) ? spec.items.slice(0, 40) : [];
  if (!wanted.length) throw new HttpError('Cart is empty');
  const menu = await MenuItem.find({ _id: { $in: wanted.map((i) => i.itemId).filter((i) => mongoose.isValidObjectId(i)) }, restaurant: r._id, available: true });
  const lines = wanted.map((w) => {
    const m = menu.find((x) => String(x._id) === String(w.itemId));
    const qty = Math.floor(num(w.qty, 'qty'));
    if (!m || qty < 1 || qty > 20) throw new HttpError(`Some items from ${r.name} are unavailable — please refresh your cart`);
    return { item: m._id, name: m.name, price: m.price, qty };
  });
  const pricing = await priceOrder(r, lines, dest, { couponCode: spec.couponCode, userId, softCoupon: soft });
  return { r, lines, pricing };
}

// Body: { orders: [{ restaurantId, items:[{itemId,qty}], couponCode }], address:{line,phone,lat,lng}, newAddress?, addressId?, method, notes, quote }
// (the old single-restaurant body { restaurantId, items, couponCode, ... } still works)
export const POST = handler(async (req, { user }) => {
  const b = await req.json();
  const specs = (Array.isArray(b.orders) ? b.orders : [b]).slice(0, 10);
  if (!specs.length) throw new HttpError('Cart is empty');
  if (new Set(specs.map((s) => String(s.restaurantId))).size !== specs.length) throw new HttpError('Duplicate restaurant in checkout');
  const lat = num(b.address?.lat, 'latitude'), lng = num(b.address?.lng, 'longitude'), dest = [lng, lat];
  // a coupon code can only be used on one restaurant's order per checkout (otherwise per-user limits could be bypassed)
  const codes = specs.map((s) => String(s.couponCode || '').trim().toUpperCase()).filter(Boolean);
  const dupCode = codes.find((c, i) => codes.indexOf(c) !== i);

  if (b.quote) {
    const quotes = [], seen = new Set();
    for (const s of specs) {
      const code = String(s.couponCode || '').trim().toUpperCase(), repeat = !!code && seen.has(code);
      if (code) seen.add(code);
      try {
        const { pricing } = await build(repeat ? { ...s, couponCode: undefined } : s, dest, user._id, true);
        if (repeat) pricing.couponError = `${code} can be used on only one restaurant per checkout`;
        quotes.push({ restaurantId: s.restaurantId, pricing });
      } catch (e) { if (!(e instanceof HttpError)) throw e; quotes.push({ restaurantId: s.restaurantId, error: e.message }); }
    }
    const good = quotes.filter((x) => x.pricing);
    return ok({ quotes, grandTotal: Math.round(good.reduce((t, x) => t + x.pricing.total, 0) * 100) / 100, pricing: quotes[0]?.pricing });
  }

  if (dupCode) throw new HttpError(`${dupCode} can be used on only one restaurant per checkout`);
  const line = str(b.address?.line, 250), phone = str(b.address?.phone, 15);
  if (!line || !phone) throw new HttpError('Delivery address and phone required');
  const method = b.method === 'cod' ? 'cod' : 'online';
  let pendingAddress, addressId;
  if (b.newAddress) pendingAddress = cleanAddress(b.newAddress); // validated now, saved after the order succeeds
  else if (mongoose.isValidObjectId(b.addressId)) addressId = b.addressId;

  const built = [];
  for (const s of specs) built.push(await build(s, dest, user._id, false));
  const grand = Math.round(built.reduce((t, x) => t + x.pricing.total, 0) * 100) / 100;
  if (method === 'online' && grand < 1) throw new HttpError('Order total is too low for online payment — choose cash on delivery');
  const group = specs.length > 1 ? randomUUID() : undefined;
  const status = method === 'cod' ? 'placed' : 'pending_payment';
  const orders = built.map(({ r, lines, pricing }) => new Order({ customer: user._id, restaurant: r._id, items: lines, notes: str(b.notes, 200), group,
    address: { line, phone, location: geoPoint(lat, lng) }, addressId, pendingAddress, ...pricing,
    status, payment: { method, status: method === 'cod' ? 'cod' : 'pending' }, timeline: [{ status }] }));

  let rzpOrderId;
  if (method === 'online') { // ONE Razorpay order / one payment covers every restaurant in the checkout
    const ro = await rzp('/v1/orders', 'POST', { amount: Math.round(grand * 100), currency: 'INR', receipt: String(orders[0]._id).slice(-20), notes: { orderIds: orders.map((o) => String(o._id)).join(',').slice(0, 250), group: group || '' } });
    rzpOrderId = ro.id; orders.forEach((o) => { o.payment.rzpOrderId = ro.id; });
  }
  for (const o of orders) await o.save();
  if (method === 'cod') for (const o of orders) { await redeemCoupon(o); await commitAddress(o); }
  return ok({ orderId: orders[0]._id, orderIds: orders.map((o) => o._id), group, method, razorpayOrderId: rzpOrderId, amount: Math.round(grand * 100), keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID }, 201);
}, ['customer']);
