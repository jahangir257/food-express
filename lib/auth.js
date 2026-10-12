import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { User } from './models';
const key = () => {
  const s = process.env.AUTH_SECRET || '';
  if (s.length < 32) throw new Error('AUTH_SECRET must be at least 32 characters');
  return new TextEncoder().encode(s);
};
export const signToken = (u) => new SignJWT({ role: u.role }).setSubject(String(u._id))
  .setProtectedHeader({ alg: 'HS256' }).setExpirationTime('7d').sign(key());
export const setAuthCookie = (t) => cookies().set('token', t, {
  httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 604800 });
export const clearAuthCookie = () => cookies().set('token', '', { path: '/', maxAge: 0 });
export async function currentUser() {
  const t = cookies().get('token')?.value;
  if (!t) return null;
  try { const { payload } = await jwtVerify(t, key()); return await User.findById(payload.sub); } catch { return null; }
}
