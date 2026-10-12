import { handler, ok, num, str, HttpError } from '@/lib/api';
import { Restaurant, User } from '@/lib/models';
import { createLinkedAccount } from '@/lib/razorpay';
export const dynamic = 'force-dynamic';
const mask = (s, n) => (s ? '•'.repeat(4) + s.slice(-n) : '');
export const GET = handler(async () => {
  const list = await Restaurant.find().sort('-createdAt').populate('owner', 'name email phone').lean();
  return ok({ restaurants: list.map((r) => ({ ...r, bank: r.bank && { ...r.bank, accountNumber: mask(r.bank.accountNumber, 4), pan: mask(r.bank.pan, 4) } })) });
}, ['admin']);
export const PATCH = handler(async (req) => {
  const b = await req.json();
  const r = await Restaurant.findById(b.id);
  if (!r) throw new HttpError('Not found', 404);
  if (b.approved !== undefined) { r.approved = !!b.approved; await User.updateOne({ _id: r.owner }, { approved: !!b.approved }); }
  if (b.commissionPct !== undefined) r.commissionPct = Math.min(60, Math.max(0, num(b.commissionPct, 'commission')));
  if (b.linkedAccountId !== undefined) r.linkedAccountId = str(b.linkedAccountId, 40) || undefined;
  if (b.createLinkedAccount) r.linkedAccountId = await createLinkedAccount(r, await User.findById(r.owner));
  await r.save();
  return ok({ linkedAccountId: r.linkedAccountId });
}, ['admin']);
