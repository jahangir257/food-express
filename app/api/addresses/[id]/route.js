import mongoose from 'mongoose';
import { handler, ok, bad } from '@/lib/api';
import { Address } from '@/lib/models';
import { clean } from '@/lib/addr';
export const dynamic = 'force-dynamic';
const mine = async (id, user) => (mongoose.isValidObjectId(id) ? Address.findOne({ _id: id, user: user._id }) : null);
// PUT: edit fields, or { makeDefault: true } to make it the default address
export const PUT = handler(async (req, { params, user }) => {
  const a = await mine(params.id, user); if (!a) return bad('Address not found', 404);
  const b = await req.json();
  if (b.makeDefault) { await Address.updateMany({ user: user._id }, { isDefault: false }); a.isDefault = true; }
  else { Object.assign(a, clean(b)); }
  await a.save();
  return ok({ address: a });
}, []);
export const DELETE = handler(async (_r, { params, user }) => {
  const a = await mine(params.id, user); if (!a) return bad('Address not found', 404);
  const wasDefault = a.isDefault; await a.deleteOne();
  if (wasDefault) { const n = await Address.findOne({ user: user._id }).sort('-updatedAt'); if (n) { n.isDefault = true; await n.save(); } }
  return ok({ deleted: true });
}, []);
