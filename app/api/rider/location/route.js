import { handler, ok, geoPoint } from '@/lib/api';
import { tryAssignForRider } from '@/lib/orderflow';
export const POST = handler(async (req, { user }) => {
  const { lat, lng } = await req.json();
  user.rider.location = geoPoint(lat, lng); user.rider.updatedAt = new Date();
  await user.save();
  await tryAssignForRider(user);
  return ok({ ok: true });
}, ['rider']);
