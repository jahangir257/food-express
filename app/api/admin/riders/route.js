import { handler, ok, HttpError } from '@/lib/api';
import { User } from '@/lib/models';
export const dynamic = 'force-dynamic';
export const GET = handler(async () => ok({ riders: await User.find({ role: 'rider' }).sort('-createdAt').select('name email phone approved rider').lean() }), ['admin']);
export const PATCH = handler(async (req) => {
  const { id, approved } = await req.json();
  const u = await User.findOneAndUpdate({ _id: id, role: 'rider' }, { approved: !!approved });
  if (!u) throw new HttpError('Not found', 404); return ok({ ok: true });
}, ['admin']);
