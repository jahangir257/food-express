import { handler, ok, bad } from '@/lib/api';
import { Order } from '@/lib/models';
import { verifyPayment } from '@/lib/razorpay';
import { markPaid } from '@/lib/orderflow';
export const POST = handler(async (req, { user }) => {
  const b = await req.json();
  const list = await Order.find({ 'payment.rzpOrderId': b.razorpay_order_id, customer: user._id }); // one payment can cover several restaurants' orders
  if (!list.length) return bad('Order not found', 404);
  if (!verifyPayment(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature)) return bad('Payment verification failed', 400);
  for (const o of list) await markPaid(o, b.razorpay_payment_id);
  return ok({ orderId: list[0]._id, orderIds: list.map((o) => o._id), status: list[0].status });
}, ['customer']);
