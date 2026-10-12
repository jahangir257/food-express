import { handler, ok } from '@/lib/api';
import { User, Order } from '@/lib/models';
export const dynamic = 'force-dynamic';
export const GET = handler(async () => {
  const users = await User.find({ role: 'customer' }).sort('-createdAt').limit(200).select('name email phone createdAt').lean();
  const agg = await Order.aggregate([{ $match: { status: 'delivered' } }, { $group: { _id: '$customer', n: { $sum: 1 }, spent: { $sum: '$total' } } }]);
  const m = Object.fromEntries(agg.map((a) => [String(a._id), a]));
  return ok({ customers: users.map((u) => ({ ...u, orders: m[u._id]?.n || 0, spent: m[u._id]?.spent || 0 })) });
}, ['admin']);
