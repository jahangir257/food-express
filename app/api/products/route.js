import { handler, ok, str } from '@/lib/api';
import { Restaurant, MenuItem, Order } from '@/lib/models';
export const dynamic = 'force-dynamic';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const GET = handler(async (req) => {
  const sp = new URL(req.url).searchParams;
  const lat = parseFloat(sp.get('lat')), lng = parseFloat(sp.get('lng')), sort = sp.get('sort') || 'popular';
  const category = str(sp.get('category'), 40), q = str(sp.get('q'), 50), limit = Math.min(40, parseInt(sp.get('limit')) || 12), diverse = sp.get('diverse') === '1';
  const geo = Number.isFinite(lat) && Number.isFinite(lng), base = { approved: true, isOpen: true };
  let rs = geo
    ? await Restaurant.aggregate([{ $geoNear: { near: { type: 'Point', coordinates: [lng, lat] }, distanceField: 'dist', maxDistance: 30000, query: base, spherical: true } }, { $project: { name: 1, image: 1, rating: 1, prepMinutes: 1, cuisines: 1, deliveryRadiusKm: 1, dist: 1 } }])
    : await Restaurant.find(base).select('name image rating prepMinutes cuisines deliveryRadiusKm').lean();
  if (geo) rs = rs.filter((r) => r.dist / 1000 <= r.deliveryRadiusKm);
  const byId = Object.fromEntries(rs.map((r) => [String(r._id), r]));
  const ids = rs.map((r) => r._id);
  const text = category || q;
  let items = await MenuItem.find({ restaurant: { $in: ids }, available: true }).lean();
  if (text) {
    const rx = new RegExp(esc(text), 'i');
    const direct = items.filter((i) => rx.test(i.name) || rx.test(i.category) || (i.tags || []).some((t) => rx.test(t)));
    if (category && direct.length < 4) {
      const cuisineIds = new Set(rs.filter((r) => (r.cuisines || []).some((c) => rx.test(c))).map((r) => String(r._id)));
      const have = new Set(direct.map((i) => String(i._id)));
      items = [...direct, ...items.filter((i) => cuisineIds.has(String(i.restaurant)) && !have.has(String(i._id)))];
    } else items = direct;
  }
  const sold = await Order.aggregate([{ $match: { restaurant: { $in: ids }, status: { $nin: ['cancelled', 'pending_payment'] }, createdAt: { $gte: new Date(Date.now() - 90 * 864e5) } } }, { $unwind: '$items' }, { $group: { _id: '$items.item', n: { $sum: '$items.qty' } } }]);
  const sm = Object.fromEntries(sold.map((s) => [String(s._id), s.n]));
  let out = items.map((i) => { const r = byId[String(i.restaurant)]; return { _id: i._id, name: i.name, price: i.price, veg: i.veg, image: i.image, description: i.description, category: i.category,
    ordered: (sm[String(i._id)] || 0) + (i.baseOrders || 0), restaurant: { _id: r._id, name: r.name, image: r.image, rating: r.rating, prepMinutes: r.prepMinutes, distanceKm: r.dist !== undefined ? +(r.dist / 1000).toFixed(1) : undefined } }; });
  const cmp = { popular: (a, b) => b.ordered - a.ordered || b.restaurant.rating - a.restaurant.rating, rating: (a, b) => b.restaurant.rating - a.restaurant.rating || b.ordered - a.ordered, price: (a, b) => a.price - b.price }[sort] || (() => 0);
  out.sort(cmp);
  if (diverse) { const seen = {}; out = out.filter((i) => (seen[i.restaurant._id] = (seen[i.restaurant._id] || 0) + 1) <= 2); }
  return ok({ products: out.slice(0, limit) });
});
