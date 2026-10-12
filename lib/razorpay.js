import crypto from 'crypto';
import { HttpError } from './api';
const base = 'https://api.razorpay.com';
const auth = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) throw new HttpError('Razorpay is not configured', 503);
  return 'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
};
export async function rzp(path, method = 'GET', body) {
  const res = await fetch(base + path, { method, headers: { Authorization: auth(), 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(data?.error?.description || `Razorpay error ${res.status}`, 502);
  return data;
}
const safeEq = (a, b) => { const x = Buffer.from(a || ''), y = Buffer.from(b || ''); return x.length === y.length && crypto.timingSafeEqual(x, y); };
export const verifyPayment = (orderId, paymentId, sig) =>
  safeEq(crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(`${orderId}|${paymentId}`).digest('hex'), sig);
export const verifyWebhook = (raw, sig) =>
  safeEq(crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '').update(raw).digest('hex'), sig);

// Razorpay Route: create a linked account for a restaurant (best effort; KYC is completed by Razorpay).
export async function createLinkedAccount(r, owner) {
  const b = r.bank || {};
  if (!b.legalName || !b.pan || !b.accountNumber || !b.ifsc) throw new HttpError('Restaurant bank/KYC details incomplete');
  const acc = await rzp('/v2/accounts', 'POST', {
    email: owner.email, phone: owner.phone, type: 'route', legal_business_name: b.legalName,
    business_type: 'individual', contact_name: b.beneficiary || b.legalName,
    reference_id: String(r._id).slice(-20),
    profile: { category: 'food', subcategory: 'restaurant', addresses: { registered: {
      street1: b.street || r.address, street2: '-', city: b.city, state: b.state, postal_code: b.pincode, country: 'IN' } } },
    legal_info: { pan: b.pan, gst: b.gst || undefined },
  });
  const prod = await rzp(`/v2/accounts/${acc.id}/products`, 'POST', { product_name: 'route', tnc_accepted: true });
  await rzp(`/v2/accounts/${acc.id}/products/${prod.id}/`, 'PATCH', {
    settlements: { account_number: b.accountNumber, ifsc_code: b.ifsc, beneficiary_name: b.beneficiary || b.legalName }, tnc_accepted: true });
  return acc.id;
}
