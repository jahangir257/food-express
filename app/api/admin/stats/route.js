import { handler, ok } from '@/lib/api';
import { Order, Restaurant, User } from '@/lib/models';
export const dynamic = 'force-dynamic';
export const GET = handler(async () => {
  const [agg] = await Order.aggregate([{ $match: { status: 'delivered' } }, { $group: { _id: null, gmv: { $sum: '$total' }, commission: { $sum: '$commission' }, delivery: { $sum: '$deliveryFee' }, discounts: { $sum: '$discount' }, fees: { $sum: '$chargesTotal' }, n: { $sum: 1 } } }]);
  const due = await Order.aggregate([{ $match: { 'payment.payout': 'manual_due', status: 'delivered' } }, { $group: { _id: '$restaurant', amount: { $sum: '$restaurantShare' }, n: { $sum: 1 } } }]);
  const daily = await Order.aggregate([{ $match: { status: 'delivered', createdAt: { $gte: new Date(Date.now() - 14 * 864e5) } } },
    { $group: { _id: { $dateToString: { format: '%m-%d', date: '$createdAt', timezone: process.env.APP_TIMEZONE || 'Asia/Kolkata' } }, v: { $sum: '$total' }, n: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
  return ok({
    delivered: agg?.n || 0, gmv: agg?.gmv || 0, commission: agg?.commission || 0, deliveryRevenue: agg?.delivery || 0, discounts: agg?.discounts || 0, fees: agg?.fees || 0,
    daily: daily.map((d) => ({ label: d._id, value: d.v, n: d.n })),
    activeOrders: await Order.countDocuments({ status: { $in: ['placed', 'accepted', 'preparing', 'ready', 'picked_up'] } }),
    unassigned: await Order.countDocuments({ rider: null, status: { $in: ['accepted', 'preparing', 'ready'] } }),
    pendingRestaurants: await Restaurant.countDocuments({ approved: false }),
    pendingRiders: await User.countDocuments({ role: 'rider', approved: false }),
    onlineRiders: await User.countDocuments({ role: 'rider', 'rider.online': true }),
    restaurants: await Restaurant.countDocuments({ approved: true }), customers: await User.countDocuments({ role: 'customer' }), manualPayoutsDue: due });
}, ['admin']);
