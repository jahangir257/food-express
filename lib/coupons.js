import { Coupon, Order } from './models';
import { HttpError } from './api';
const r2 = (n) => Math.round(n * 100) / 100;
export async function validateCoupon(codeRaw, { userId, restaurantId, subtotal }) {
  const code = String(codeRaw || '').trim().toUpperCase();
  if (!code) return null;
  const c = await Coupon.findOne({ code, active: true });
  if (!c) throw new HttpError('Invalid coupon code');
  const now = new Date();
  if (c.validFrom && now < c.validFrom) throw new HttpError('This coupon is not active yet');
  if (c.validTo && now > c.validTo) throw new HttpError('This coupon has expired');
  if (c.scope === 'restaurant' && String(c.restaurant) !== String(restaurantId)) throw new HttpError('This coupon is not valid for this restaurant');
  if (subtotal < c.minOrder) throw new HttpError(`Add items worth ₹${c.minOrder} or more to use this coupon`);
  if (c.usageLimit && c.usedCount >= c.usageLimit) throw new HttpError('This coupon has reached its usage limit');
  const valid = { status: { $nin: ['cancelled', 'pending_payment'] } };
  if (c.perUserLimit && (await Order.countDocuments({ customer: userId, couponCode: c.code, ...valid })) >= c.perUserLimit) throw new HttpError('You have already used this coupon');
  if (c.firstOrderOnly && (await Order.countDocuments({ customer: userId, ...valid }))) throw new HttpError('This coupon is valid on your first order only');
  let d = c.type === 'percent' ? (subtotal * c.value) / 100 : c.value;
  if (c.maxDiscount) d = Math.min(d, c.maxDiscount);
  d = Math.min(d, subtotal);
  return { code: c.code, discount: r2(d), by: c.scope, description: c.description };
}
export const redeemCoupon = (order) => order.couponCode && Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
export const releaseCoupon = (order) => order.couponCode && Coupon.updateOne({ code: order.couponCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
