import mongoose from 'mongoose';
import { handler, ok, bad } from '@/lib/api';
import { User, Restaurant } from '@/lib/models';
import { distanceKm } from '@/lib/geo';
export const dynamic = 'force-dynamic';
// GET /api/favorites?ids=1            -> { ids: [...] }
// GET /api/favorites?lat=..&lng=..    -> { restaurants: [...] } (with distance)
export const GET = handler(async (req, { user }) => {
  const u = await User.findById(user._id).select('favorites').lean(), ids = (u?.favorites || []).map(String);
  const sp = new URL(req.url).searchParams;
  if (sp.get('ids')) return ok({ ids });
  const lat = parseFloat(sp.get('lat')), lng = parseFloat(sp.get('lng')), has = Number.isFinite(lat) && Number.isFinite(lng);
  const rs = await Restaurant.find({ _id: { $in: ids }, approved: true }).select('-bank -linkedAccountId -owner').lean();
  const restaurants = rs.map((r) => {
    const d = has && r.location?.coordinates?.length === 2 ? +distanceKm([lng, lat], r.location.coordinates).toFixed(1) : undefined;
    return { ...r, location: undefined, distanceKm: d, serviceable: r.isOpen && (d === undefined || d <= (r.deliveryRadiusKm || 8)) };
  }).sort((a, b) => ids.indexOf(String(b._id)) - ids.indexOf(String(a._id)));
  return ok({ restaurants, ids });
}, []);
// POST { restaurantId, favorite?: boolean } -> toggles (or sets) the favourite flag
export const POST = handler(async (req, { user }) => {
  const b = await req.json();
  if (!mongoose.isValidObjectId(b.restaurantId)) return bad('Invalid restaurant');
  if (!(await Restaurant.exists({ _id: b.restaurantId, approved: true }))) return bad('Restaurant not found', 404);
  const u = await User.findById(user._id).select('favorites');
  const has = u.favorites.some((x) => String(x) === String(b.restaurantId));
  const want = typeof b.favorite === 'boolean' ? b.favorite : !has;
  if (want && !has) u.favorites.push(b.restaurantId);
  if (!want && has) u.favorites = u.favorites.filter((x) => String(x) !== String(b.restaurantId));
  await u.save();
  return ok({ favorite: want, ids: u.favorites.map(String) });
}, []);
