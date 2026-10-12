import mongoose from 'mongoose';
import { handler, ok, bad } from '@/lib/api';
import { Restaurant, MenuItem, Coupon, Review } from '@/lib/models';
import { distanceKm } from '@/lib/geo';
export const dynamic = 'force-dynamic';
export const GET = handler(async (req, { params }) => {
  if (!mongoose.isValidObjectId(params.id)) return bad('Not found', 404);
  const r = await Restaurant.findOne({ _id: params.id, approved: true }).select('-bank -linkedAccountId -owner').lean();
  if (!r) return bad('Not found', 404);
  const menu = await MenuItem.find({ restaurant: r._id, available: true }).sort('category name').lean();
  const dr = await Review.aggregate([{ $match: { restaurant: r._id } }, { $unwind: '$dishes' }, { $group: { _id: '$dishes.item', avg: { $avg: '$dishes.rating' }, n: { $sum: 1 } } }]); // per-dish ratings from customer reviews
  const dm = new Map(dr.map((x) => [String(x._id), x])); menu.forEach((m) => { const x = dm.get(String(m._id)); if (x) { m.rating = +x.avg.toFixed(1); m.ratings = x.n; } });
  const now = new Date();
  const coupons = (await Coupon.find({ active: true, $or: [{ scope: 'platform' }, { scope: 'restaurant', restaurant: r._id }], $and: [{ $or: [{ validTo: null }, { validTo: { $gte: now } }] }, { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] }] })
    .select('code description type value maxDiscount minOrder usageLimit usedCount firstOrderOnly').limit(10).lean()).filter((c) => !c.usageLimit || c.usedCount < c.usageLimit);
  const sp = new URL(req.url).searchParams, lat = parseFloat(sp.get('lat')), lng = parseFloat(sp.get('lng'));
  let distance = null, serviceable = null;
  if (Number.isFinite(lat) && Number.isFinite(lng) && r.location?.coordinates?.length === 2) { distance = +distanceKm([lng, lat], r.location.coordinates).toFixed(1); serviceable = distance <= (r.deliveryRadiusKm || 8); }
  if (r.location) r.location = undefined;
  return ok({ restaurant: r, menu, coupons, distanceKm: distance, serviceable });
});
