import { handler, ok, str } from '@/lib/api';
import { Restaurant, MenuItem } from '@/lib/models';
export const dynamic = 'force-dynamic';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const GET = handler(async (req) => {
  const q = str(new URL(req.url).searchParams.get('q'), 40);
  if (q.length < 2) return ok({ restaurants: [], dishes: [] });
  const rx = new RegExp(esc(q), 'i');
  const approved = (await Restaurant.find({ approved: true }).select('_id').lean()).map((r) => r._id);
  const [restaurants, dishes] = await Promise.all([
    Restaurant.find({ approved: true, $or: [{ name: rx }, { cuisines: rx }] }).select('name image cuisines rating').limit(5).lean(),
    MenuItem.find({ restaurant: { $in: approved }, available: true, name: rx }).select('name price veg restaurant').limit(6).populate('restaurant', 'name').lean()]);
  return ok({ restaurants, dishes });
});
