import { handler, ok, str } from '@/lib/api';
import { Restaurant, MenuItem } from '@/lib/models';
export const dynamic = 'force-dynamic';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const GET = handler(async (req) => {
  const sp = new URL(req.url).searchParams;
  const lat = parseFloat(sp.get('lat')), lng = parseFloat(sp.get('lng')), q = str(sp.get('q'), 50), sort = sp.get('sort') || 'relevance';
  const match = { approved: true };
  if (sp.get('veg') === '1') match.pureVeg = true;
  if (sp.get('rating') === '1') match.rating = { $gte: 4 };
  if (sp.get('offers') === '1') match.offer = { $nin: [null, ''] };
  if (q) { const rx = new RegExp(esc(q), 'i'); const byDish = await MenuItem.distinct('restaurant', { name: rx, available: true }); match.$or = [{ name: rx }, { cuisines: rx }, { _id: { $in: byDish } }]; }
  let list;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    list = await Restaurant.aggregate([{ $geoNear: { near: { type: 'Point', coordinates: [lng, lat] }, distanceField: 'dist', maxDistance: 30000, query: match, spherical: true } },
      { $project: { bank: 0, linkedAccountId: 0, owner: 0 } }, { $limit: 80 }]);
    list = list.map((r) => ({ ...r, distanceKm: +(r.dist / 1000).toFixed(1), serviceable: r.isOpen && r.dist / 1000 <= r.deliveryRadiusKm }));
  } else list = (await Restaurant.find(match).select('-bank -linkedAccountId -owner').limit(80).lean()).map((r) => ({ ...r, serviceable: r.isOpen }));
  const by = { rating: (a, b) => b.rating - a.rating, time: (a, b) => a.prepMinutes - b.prepMinutes, distance: (a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0) }[sort];
  list.sort((a, b) => (b.serviceable - a.serviceable) || (by ? by(a, b) : 0));
  return ok({ restaurants: list });
});
