import { handler, ok, str, HttpError } from '@/lib/api';
import { Category } from '@/lib/models';
export const dynamic = 'force-dynamic';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Restaurant owners can create a category; it is marked NEW for 14 days.
export const POST = handler(async (req, { user }) => {
  const b = await req.json(), name = str(b.name, 40);
  if (!name) throw new HttpError('Category name required');
  const ex = await Category.findOne({ name: new RegExp('^' + esc(name) + '$', 'i') }).lean();
  if (ex) return ok({ category: ex, existed: true });
  const c = await Category.create({ name, emoji: str(b.emoji, 4) || '🍽️', createdBy: user._id, byRole: 'restaurant', order: 999 });
  return ok({ category: { ...c.toObject(), isNew: true } }, 201);
}, ['restaurant']);
