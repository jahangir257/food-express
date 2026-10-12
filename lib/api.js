import { NextResponse } from 'next/server';
import { db } from './db';
import { currentUser } from './auth';
import { hit } from './ratelimit';
export class HttpError extends Error { constructor(m, s = 400) { super(m); this.status = s; } }
export const ok = (d, s = 200) => NextResponse.json(d, { status: s });
export const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
// roles: undefined = public, [] = any logged-in user, ['admin'] = specific roles
export const handler = (fn, roles, limit) => async (req, ctx = {}) => {
  try {
    if (limit) {
      const ip = (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
      if (!hit(`${limit.key}:${ip}`, limit.max, limit.windowMs)) return bad('Too many requests', 429);
    }
    await db();
    let user = null;
    if (roles) {
      user = await currentUser();
      if (!user) return bad('Unauthorized', 401);
      if (roles.length && !roles.includes(user.role)) return bad('Forbidden', 403);
    }
    return await fn(req, { ...ctx, user });
  } catch (e) {
    if (!(e instanceof HttpError)) console.error(e);
    return bad(e instanceof HttpError ? e.message : 'Server error', e.status || 500);
  }
};
export const num = (v, name) => { const n = Number(v); if (!Number.isFinite(n)) throw new HttpError(`Invalid ${name}`); return n; };
export const str = (v, max = 200) => String(v ?? '').trim().slice(0, max);
export const geoPoint = (lat, lng) => ({ type: 'Point', coordinates: [num(lng, 'lng'), num(lat, 'lat')] });
