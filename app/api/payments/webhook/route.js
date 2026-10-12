import { handler, ok, bad } from '@/lib/api';
import { Order } from '@/lib/models';
import { verifyWebhook } from '@/lib/razorpay';
import { markPaid } from '@/lib/orderflow';
// Configure in Razorpay Dashboard -> Webhooks: payment.captured, payment.failed
export const POST = handler(async (req) => {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get('x-razorpay-signature'))) return bad('Bad signature', 400);
  const ev = JSON.parse(raw);
  const p = ev.payload?.payment?.entity;
  if (p?.order_id) {
    const list = await Order.find({ 'payment.rzpOrderId': p.order_id });
    for (const o of list) {
      if (ev.event === 'payment.captured') await markPaid(o, p.id);
      if (ev.event === 'payment.failed' && o.payment.status === 'pending') { o.payment.status = 'failed'; await o.save(); }
    }
  }
  return ok({ received: true });
});
