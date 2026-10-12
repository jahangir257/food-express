import bcrypt from 'bcryptjs';
import { handler, ok, bad, str } from '@/lib/api';
import { User } from '@/lib/models';
import { signToken, setAuthCookie } from '@/lib/auth';
export const POST = handler(async (req) => {
  const b = await req.json();
  const u = await User.findOne({ email: str(b.email, 120).toLowerCase() }).select('+passwordHash');
  if (!u || !(await bcrypt.compare(String(b.password || ''), u.passwordHash))) return bad('Invalid email or password', 401);
  if (!u.approved) return bad('Your account is awaiting admin approval', 403);
  setAuthCookie(await signToken(u));
  return ok({ user: { id: u._id, name: u.name, role: u.role } });
}, undefined, { key: 'login', max: 15, windowMs: 15 * 60e3 });
