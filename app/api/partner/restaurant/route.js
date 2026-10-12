import { handler, ok, str, num, geoPoint, HttpError } from '@/lib/api';
import { Restaurant } from '@/lib/models';
export const dynamic = 'force-dynamic';
export const GET = handler(async (_r, { user }) => {
  const r = await Restaurant.findById(user.restaurant).lean();
  if (r?.bank) { r.bank.accountNumber = r.bank.accountNumber ? '••••' + r.bank.accountNumber.slice(-4) : ''; r.bank.pan = r.bank.pan ? '••••••' + r.bank.pan.slice(-4) : ''; }
  return ok({ restaurant: r });
}, ['restaurant']);
export const PUT = handler(async (req, { user }) => {
  const b = await req.json();
  const r = await Restaurant.findById(user.restaurant);
  if (!r) throw new HttpError('Not found', 404);
  for (const k of ['name', 'description', 'address', 'image', 'logo', 'offer']) if (b[k] !== undefined) r[k] = str(b[k], 300);
  if (b.cuisines !== undefined) r.cuisines = String(b.cuisines).split(',').map((s) => s.trim()).filter(Boolean).slice(0, 8);
  if (b.isOpen !== undefined) r.isOpen = !!b.isOpen;
  if (Array.isArray(b.charges)) r.charges = b.charges.slice(0, 6).filter((c) => str(c.name, 40)).map((c) => ({ name: str(c.name, 40), amount: Math.min(500, Math.max(0, Number(c.amount) || 0)) }));
  if (b.pureVeg !== undefined) r.pureVeg = !!b.pureVeg;
  if (b.deliveryRadiusKm) r.deliveryRadiusKm = Math.min(15, Math.max(1, num(b.deliveryRadiusKm, 'radius')));
  if (b.prepMinutes) r.prepMinutes = Math.min(120, Math.max(5, num(b.prepMinutes, 'prep time')));
  if (b.lat && b.lng) r.location = geoPoint(b.lat, b.lng);
  if (b.bank) {
    const nb = b.bank, cur = r.bank?.toObject ? r.bank.toObject() : { ...(r.bank || {}) };
    const prevIfsc = cur.ifsc;
    for (const k of ['legalName', 'gst', 'beneficiary', 'ifsc', 'street', 'city', 'state', 'pincode']) if (nb[k] !== undefined) cur[k] = str(nb[k], 120);
    if (nb.pan && !nb.pan.includes('•')) cur.pan = str(nb.pan, 10).toUpperCase();
    if (nb.accountNumber && !nb.accountNumber.includes('•')) { cur.accountNumber = str(nb.accountNumber, 20); r.linkedAccountId = undefined; }
    if (nb.ifsc && nb.ifsc.toUpperCase() !== prevIfsc) r.linkedAccountId = undefined; // bank change -> admin must re-link
    r.bank = cur;
  }
  await r.save();
  return ok({ saved: true });
}, ['restaurant']);
