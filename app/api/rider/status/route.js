import { handler, ok } from '@/lib/api';
export const POST = handler(async (req, { user }) => {
  const { online } = await req.json();
  user.rider.online = !!online; await user.save();
  return ok({ online: user.rider.online });
}, ['rider']);
