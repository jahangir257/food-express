import { handler, ok } from '@/lib/api';
import { Order } from '@/lib/models';
export const dynamic = 'force-dynamic';
const tz = process.env.APP_TIMEZONE || 'Asia/Kolkata';
const day = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: tz });
export const GET = handler(async (_r, { user }) => {
  const orders = await Order.find({ restaurant: user.restaurant, status: { $ne: 'pending_payment' } }).sort('-createdAt').limit(200)
    .populate('rider', 'name phone').populate('customer', 'name').select('-address').lean();
  const done = orders.filter((o) => o.status === 'delivered'), today = day(new Date());
  const daily = {}; for (let i = 6; i >= 0; i--) daily[day(Date.now() - i * 864e5)] = 0;
  done.forEach((o) => { const k = day(o.createdAt); if (k in daily) daily[k] += o.restaurantShare; });
  const top = {}; done.forEach((o) => o.items.forEach((i) => { top[i.name] = (top[i.name] || 0) + i.qty; }));
  const sum = (a) => a.reduce((s, o) => s + o.restaurantShare, 0);
  return ok({ orders, daily: Object.entries(daily).map(([l, v]) => ({ label: l.slice(5), value: v })), top: Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5),
    stats: { todayOrders: orders.filter((o) => day(o.createdAt) === today && o.status !== 'cancelled').length, todayEarnings: sum(done.filter((o) => day(o.createdAt) === today)),
      pending: orders.filter((o) => o.status === 'placed').length, delivered: done.length, earnings: sum(done),
      held: sum(orders.filter((o) => o.payment.payout === 'held')), due: sum(orders.filter((o) => o.payment.payout === 'manual_due')) } });
}, ['restaurant']);
