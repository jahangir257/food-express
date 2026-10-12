import { distanceKm } from './geo';
import { HttpError } from './api';
import { getSettings } from './settings';
import { validateCoupon } from './coupons';
const r2 = (n) => Math.round(n * 100) / 100;
export async function priceOrder(restaurant, lines, dest, { couponCode, userId, softCoupon } = {}) {
  const S = await getSettings();
  const distance = distanceKm(restaurant.location.coordinates, dest);
  const maxKm = Math.min(restaurant.deliveryRadiusKm || 8, S.maxDeliveryKm);
  if (distance > maxKm) throw new HttpError(`This restaurant delivers up to ${maxKm} km; your location is ${distance.toFixed(1)} km away`);
  const subtotal = r2(lines.reduce((s, l) => s + l.price * l.qty, 0));
  let coupon = null, couponError = null;
  if (couponCode) { try { coupon = await validateCoupon(couponCode, { userId, restaurantId: restaurant._id, subtotal }); } catch (e) { if (!softCoupon) throw e; couponError = e.message; } }
  const discount = coupon?.discount || 0;
  const tax = r2(((subtotal - discount) * S.taxPct) / 100);
  const full = r2(S.deliveryBaseFee + distance * S.deliveryPerKm);
  const free = !!S.freeDeliveryEnabled && subtotal >= S.freeDeliveryAbove;
  const deliveryFee = free ? 0 : full;
  const charges = [];
  for (const c of restaurant.charges || []) if (c.amount > 0) charges.push({ name: c.name || 'Restaurant charge', amount: r2(c.amount), by: 'restaurant' });
  if (S.platformFee > 0) charges.push({ name: 'Platform fee', amount: r2(S.platformFee), by: 'platform' });
  for (const c of S.extraCharges || []) if (c.active !== false && c.value > 0) charges.push({ name: c.name, amount: r2(c.type === 'percent' ? (subtotal * c.value) / 100 : c.value), by: 'platform' });
  const chargesTotal = r2(charges.reduce((s, c) => s + c.amount, 0));
  const total = r2(subtotal - discount + tax + deliveryFee + chargesTotal);
  const pct = restaurant.commissionPct ?? S.defaultCommissionPct;
  const commission = r2((subtotal * pct) / 100);
  const restCharges = charges.filter((c) => c.by === 'restaurant').reduce((s, c) => s + c.amount, 0);
  const restaurantShare = Math.max(0, r2(subtotal - commission - (coupon?.by === 'restaurant' ? discount : 0) + restCharges));
  return { subtotal, discount, couponCode: coupon?.code, couponBy: coupon?.by, couponError, tax, taxPct: S.taxPct, deliveryFee, deliveryFeeFull: full, freeDelivery: free,
    freeDeliveryAbove: S.freeDeliveryEnabled ? S.freeDeliveryAbove : null, charges, chargesTotal, total, commission, restaurantShare, riderPay: r2((full * S.riderSharePct) / 100), distanceKm: r2(distance) };
}
