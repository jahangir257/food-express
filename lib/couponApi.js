import { str, num, HttpError } from './api';
import { Coupon } from './models';
export const couponDoc = (b) => {
  const type = b.type === 'flat' ? 'flat' : 'percent', value = num(b.value, 'value');
  if (value <= 0 || (type === 'percent' && value > 100)) throw new HttpError('Enter a valid discount value');
  const d = (v) => (v ? new Date(v) : undefined);
  return { code: str(b.code, 20).toUpperCase().replace(/[^A-Z0-9_-]/g, ''), description: str(b.description, 120), type, value, maxDiscount: Math.max(0, Number(b.maxDiscount) || 0), minOrder: Math.max(0, Number(b.minOrder) || 0),
    usageLimit: Math.max(0, Number(b.usageLimit) || 0), perUserLimit: Math.max(0, Number(b.perUserLimit) || 0), firstOrderOnly: !!b.firstOrderOnly, validFrom: d(b.validFrom) || null, validTo: d(b.validTo) || null, active: b.active !== false };
};
export async function saveCoupon(b, extra, filter) {
  const d = couponDoc(b);
  if (d.code.length < 3) throw new HttpError('Code must be at least 3 characters');
  if (b.id) { const c = await Coupon.findOneAndUpdate({ _id: b.id, ...filter }, { ...d, ...extra }, { new: true }); if (!c) throw new HttpError('Not found', 404); return c; }
  if (await Coupon.exists({ code: d.code })) throw new HttpError('This coupon code already exists');
  return Coupon.create({ ...d, ...extra });
}
