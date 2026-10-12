import { handler, ok, HttpError } from '@/lib/api';
import { Order } from '@/lib/models';
export const dynamic = 'force-dynamic';
export const GET = handler(async (req) => {
  const sp = new URL(req.url).searchParams, q = { status: { $ne: 'pending_payment' } };
  if (sp.get('status')) q.status = sp.get('status');
  if (sp.get('payout')) q['payment.payout'] = sp.get('payout');
  return ok({ orders: await Order.find(q).sort('-createdAt').limit(150).populate('restaurant', 'name').populate('rider', 'name').populate('customer', 'name').lean() });
}, ['admin']);
// Mark a manual restaurant payout as paid (bank transfer done outside Razorpay Route)
export const PATCH = handler(async (req) => {
  const { id, ids } = await req.json();
  const r = await Order.updateMany({ _id: { $in: ids || [id] }, 'payment.payout': 'manual_due', status: 'delivered' }, { 'payment.payout': 'manual_paid' });
  if (!r.modifiedCount) throw new HttpError('Nothing to mark paid'); return ok({ ok: true });
}, ['admin']);
