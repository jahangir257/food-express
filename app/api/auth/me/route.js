import { handler, ok } from '@/lib/api';
import { currentUser } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export const GET = handler(async () => {
  const u = await currentUser();
  return ok({ user: u ? { id: u._id, name: u.name, email: u.email, role: u.role, phone: u.phone, vehicle: u.rider?.vehicle } : null });
});
