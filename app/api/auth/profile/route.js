import bcrypt from 'bcryptjs';
import { handler, ok, str, HttpError } from '@/lib/api';
import { User } from '@/lib/models';
export const dynamic = 'force-dynamic';
const out = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, phone: u.phone, vehicle: u.rider?.vehicle });
export const GET = handler(async (_r, { user }) => ok({ user: out(user) }), []);
export const PUT = handler(async (req, { user }) => {
  const b = await req.json(), name = str(b.name, 80);
  if (!name) throw new HttpError('Name required');
  const u = await User.findById(user._id).select('+passwordHash');
  u.name = name; u.phone = str(b.phone, 20);
  if (u.role === 'rider' && b.vehicle !== undefined) u.set('rider.vehicle', str(b.vehicle, 40));
  if (b.newPassword) {
    if (String(b.newPassword).length < 6) throw new HttpError('New password must be at least 6 characters');
    if (!(await bcrypt.compare(String(b.currentPassword || ''), u.passwordHash))) throw new HttpError('Current password is incorrect');
    u.passwordHash = await bcrypt.hash(String(b.newPassword), 10);
  }
  await u.save();
  return ok({ user: out(u) });
}, []);
