import { handler, ok } from '@/lib/api';
import { Order } from '@/lib/models';
import { gemini } from '@/lib/gemini';
export const POST = handler(async () => {
  const since = new Date(Date.now() - 7 * 864e5);
  const byStatus = await Order.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: '$status', n: { $sum: 1 }, gmv: { $sum: '$total' } } }]);
  const top = await Order.aggregate([{ $match: { createdAt: { $gte: since }, status: 'delivered' } }, { $unwind: '$items' }, { $group: { _id: '$items.name', qty: { $sum: '$items.qty' } } }, { $sort: { qty: -1 } }, { $limit: 8 }]);
  const slow = await Order.aggregate([{ $match: { createdAt: { $gte: since }, status: 'delivered' } }, { $project: { mins: { $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 60000] } } }, { $group: { _id: null, avg: { $avg: '$mins' } } }]);
  const text = await gemini(`Last 7 days data (Asia/Kolkata). Orders by status: ${JSON.stringify(byStatus)}. Top dishes: ${JSON.stringify(top)}. Avg minutes order->delivered: ${slow[0]?.avg?.toFixed(1) ?? 'n/a'}.\nGive 5 concise, actionable bullet insights for the marketplace admin (ops, promotions, rider supply).`, { system: 'You are an analytics assistant for a food delivery marketplace admin.' });
  return ok({ insights: text });
}, ['admin'], { key: 'ins', max: 10, windowMs: 60e3 });
