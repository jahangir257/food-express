import mongoose from 'mongoose';
import { handler, ok, str, num, HttpError } from '@/lib/api';
import { MenuItem } from '@/lib/models';
export const dynamic = 'force-dynamic';
const pick = (b) => ({ name: str(b.name, 100), description: str(b.description, 400), image: str(b.image, 400), price: num(b.price, 'price'),
  veg: !!b.veg, category: str(b.category, 40) || 'Main', available: b.available !== false, tags: String(b.tags || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 8) });
export const GET = handler(async (_r, { user }) => ok({ menu: await MenuItem.find({ restaurant: user.restaurant }).sort('category name').lean() }), ['restaurant']);
export const POST = handler(async (req, { user }) => { const d = pick(await req.json()); if (!d.name || d.price < 1) throw new HttpError('Name and price required');
  return ok({ item: await MenuItem.create({ ...d, restaurant: user.restaurant }) }, 201); }, ['restaurant']);
export const PUT = handler(async (req, { user }) => { const b = await req.json();
  const it = await MenuItem.findOneAndUpdate({ _id: b.id, restaurant: user.restaurant }, pick(b), { new: true });
  if (!it) throw new HttpError('Not found', 404); return ok({ item: it }); }, ['restaurant']);
export const DELETE = handler(async (req, { user }) => { const id = new URL(req.url).searchParams.get('id');
  if (!mongoose.isValidObjectId(id)) throw new HttpError('Invalid id');
  await MenuItem.deleteOne({ _id: id, restaurant: user.restaurant }); return ok({ deleted: true }); }, ['restaurant']);
