import mongoose from 'mongoose';
import { handler, ok, str, HttpError } from '@/lib/api';
import { Order, Review, Restaurant } from '@/lib/models';
export const dynamic = 'force-dynamic';
const star = (v) => { const n = Math.round(Number(v)); return n >= 1 && n <= 5 ? n : 0; };

// Public: reviews of a restaurant (newest first) + rating summary
export const GET = handler(async (req) => {
  const sp = new URL(req.url).searchParams, rid = sp.get('restaurantId');
  if (!mongoose.isValidObjectId(rid)) throw new HttpError('Invalid restaurant');
  const page = Math.max(0, parseInt(sp.get('page')) || 0), per = 10, _id = new mongoose.Types.ObjectId(rid);
  const [reviews, dist] = await Promise.all([
    Review.find({ restaurant: rid }).sort('-createdAt').skip(page * per).limit(per).select('customerName rating comment dishes createdAt').lean(),
    Review.aggregate([{ $match: { restaurant: _id } }, { $group: { _id: '$rating', n: { $sum: 1 } } }]),
  ]);
  const counts = [0, 0, 0, 0, 0, 0]; dist.forEach((d) => { counts[d._id] = d.n; });
  const count = counts.reduce((a, b) => a + b, 0), avg = count ? counts.reduce((s, n, i) => s + n * i, 0) / count : 0;
  return ok({ reviews, count, average: +avg.toFixed(1), counts: counts.slice(1).reverse(), hasMore: (page + 1) * per < count });
});

// Customer reviews a delivered order: restaurant rating + optional per-dish ratings + comment (one review per order)
export const POST = handler(async (req, { user }) => {
  const b = await req.json();
  if (!mongoose.isValidObjectId(b.orderId)) throw new HttpError('Invalid order');
  const o = await Order.findOne({ _id: b.orderId, customer: user._id });
  if (!o) throw new HttpError('Order not found', 404);
  if (o.status !== 'delivered') throw new HttpError('You can review an order after it is delivered');
  if (await Review.exists({ order: o._id })) throw new HttpError('You have already reviewed this order');
  const rating = star(b.rating); if (!rating) throw new HttpError('Please rate the restaurant (1–5 stars)');
  const dishes = (Array.isArray(b.dishes) ? b.dishes : []).map((d) => {
    const line = o.items.find((i) => String(i.item) === String(d.itemId)), r = star(d.rating);
    return line && r ? { item: line.item, name: line.name, rating: r } : null;
  }).filter(Boolean);
  let rv;
  try { rv = await Review.create({ customer: user._id, customerName: user.name, restaurant: o.restaurant, order: o._id, rating, comment: str(b.comment, 600), dishes }); }
  catch (e) { if (e.code === 11000) throw new HttpError('You have already reviewed this order'); throw e; }
  o.reviewed = true; await o.save();
  const [agg] = await Review.aggregate([{ $match: { restaurant: o.restaurant } }, { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }]);
  if (agg) await Restaurant.updateOne({ _id: o.restaurant }, { $set: { rating: +agg.avg.toFixed(1), ratingCount: agg.n } });
  return ok({ review: rv }, 201);
}, ['customer']);
