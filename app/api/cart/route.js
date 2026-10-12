import mongoose from 'mongoose';
import { handler, ok, str } from '@/lib/api';
import { Cart, MenuItem, Restaurant } from '@/lib/models';
export const dynamic = 'force-dynamic';
const valid = (id) => mongoose.isValidObjectId(id);
const MAX_QTY = 50, MAX_CARTS = 5; // at most 5 restaurant carts at a time
// normalise anything the client sends: size caps, integer qty, no duplicate restaurants / items
const clean = (input) => {
  const byR = new Map();
  (Array.isArray(input) ? input : []).slice(0, 20).forEach((c) => {
    const rid = String(c?.restaurant?._id || ''); if (!valid(rid)) return;
    const cart = byR.get(rid) || { restaurant: { _id: rid, name: str(c.restaurant.name, 120), image: str(c.restaurant.image, 500) }, items: [] };
    (Array.isArray(c.items) ? c.items : []).slice(0, 60).forEach((i) => {
      const id = String(i?._id || ''); if (!valid(id)) return;
      const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(i.qty) || 1))), ex = cart.items.find((x) => x._id === id);
      if (ex) ex.qty = Math.min(MAX_QTY, ex.qty + qty);
      else cart.items.push({ _id: id, name: str(i.name, 120), price: Math.max(0, Number(i.price) || 0), veg: !!i.veg, image: str(i.image, 500), qty });
    });
    byR.set(rid, cart);
  });
  return [...byR.values()].filter((c) => c.items.length).slice(0, MAX_CARTS);
};
// combine two carts: same restaurant -> items are merged (same dish: quantities add up); other restaurants stay separate carts
const merge = (a, b) => clean([...a, ...b]);
// bring names / prices / availability up to date and drop dishes or restaurants that no longer exist
const refresh = async (carts) => {
  if (!carts.length) return carts;
  const ids = carts.flatMap((c) => c.items.map((i) => i._id)), rids = carts.map((c) => c.restaurant._id);
  const [items, rests] = await Promise.all([MenuItem.find({ _id: { $in: ids }, available: true }).select('restaurant name price veg image').lean(), Restaurant.find({ _id: { $in: rids }, approved: true }).select('name image').lean()]);
  const im = new Map(items.map((m) => [String(m._id), m])), rm = new Map(rests.map((r) => [String(r._id), r]));
  return carts.map((c) => { const r = rm.get(c.restaurant._id); if (!r) return null;
    const list = c.items.map((i) => { const m = im.get(i._id); return m && String(m.restaurant) === c.restaurant._id ? { _id: i._id, name: m.name, price: m.price, veg: m.veg, image: m.image || '', qty: i.qty } : null; }).filter(Boolean);
    return list.length ? { restaurant: { _id: c.restaurant._id, name: r.name, image: r.image || '' }, items: list } : null; }).filter(Boolean);
};
const stored = async (user) => clean((await Cart.findOne({ user: user._id }).lean())?.carts);
const save = (user, carts) => Cart.updateOne({ user: user._id }, { $set: { carts } }, { upsert: true });
export const GET = handler(async (req, { user }) => ok({ carts: await refresh(await stored(user)) }), ['customer']);
// replace the saved cart with what the browser has
export const PUT = handler(async (req, { user }) => { const carts = clean((await req.json()).carts); await save(user, carts); return ok({ carts }); }, ['customer']);
// merge a guest cart (made while logged out) into the account's saved cart at login
export const POST = handler(async (req, { user }) => { const carts = merge(await stored(user), clean((await req.json()).carts)); await save(user, carts); return ok({ carts: await refresh(carts) }); }, ['customer']);
