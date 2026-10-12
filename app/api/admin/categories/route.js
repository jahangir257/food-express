import { handler, ok, str, num, HttpError } from '@/lib/api';
import { Category } from '@/lib/models';
export const dynamic = 'force-dynamic';
const pick = (b) => ({ name: str(b.name, 40), image: str(b.image, 400), emoji: str(b.emoji, 4), order: Number(b.order) || 0, active: b.active !== false });
export const GET = handler(async () => ok({ categories: (await Category.find().sort('order name').lean()).map((c) => ({ ...c, isNew: !!c.createdAt && Date.now() - new Date(c.createdAt).getTime() < 14 * 864e5 })) }), ['admin']);
export const POST = handler(async (req, { user }) => { const d = pick(await req.json()); if (!d.name) throw new HttpError('Name required'); return ok({ category: await Category.create({ ...d, createdBy: user._id, byRole: 'admin' }) }, 201); }, ['admin']);
export const PUT = handler(async (req) => { const b = await req.json(); const c = await Category.findByIdAndUpdate(b.id, pick(b), { new: true }); if (!c) throw new HttpError('Not found', 404); return ok({ category: c }); }, ['admin']);
export const DELETE = handler(async (req) => { await Category.deleteOne({ _id: new URL(req.url).searchParams.get('id') }); return ok({ deleted: true }); }, ['admin']);
