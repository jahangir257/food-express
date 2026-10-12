import { handler, ok } from '@/lib/api';
import { Order } from '@/lib/models';
export const dynamic = 'force-dynamic';
export const GET = handler(async (req, { user }) => {
  if (new URL(req.url).searchParams.get('history')) {
    const h = await Order.find({ rider: user._id, status: 'delivered' }).sort('-updatedAt').limit(100).populate('restaurant', 'name').select('restaurant riderPay deliveryFee distanceKm updatedAt payment.method total').lean();
    return ok({ history: h.map((o) => ({ ...o, earning: +(o.riderPay ?? o.deliveryFee * 0.8).toFixed(2) })) });
  }
  const active = await Order.find({ rider: user._id, status: { $in: ['accepted', 'preparing', 'ready', 'picked_up'] } })
    .populate('restaurant', 'name address location').populate('customer', 'name').select('-commission -restaurantShare').lean();
  const [agg] = await Order.aggregate([{ $match: { rider: user._id, status: 'delivered' } }, { $group: { _id: null, n: { $sum: 1 }, fee: { $sum: { $ifNull: ['$riderPay', { $multiply: ['$deliveryFee', 0.8] }] } } } }]);
  return ok({ active, delivered: agg?.n || 0, earnings: +(agg?.fee || 0).toFixed(2), online: user.rider.online, busy: user.rider.busy });
}, ['rider']);
