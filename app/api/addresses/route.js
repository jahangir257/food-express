import { handler, ok, HttpError } from '@/lib/api';
import { Address } from '@/lib/models';
import { clean } from '@/lib/addr';
export const dynamic = 'force-dynamic';
export const GET = handler(async (_r, { user }) => ok({ addresses: await Address.find({ user: user._id }).sort('-isDefault -updatedAt').lean() }), []);
export const POST = handler(async (req, { user }) => {
  const body = await req.json(), d = clean(body);
  if ((await Address.countDocuments({ user: user._id })) >= 15) throw new HttpError('You can save up to 15 addresses');
  const first = !(await Address.exists({ user: user._id }));
  const makeDefault = first || !!body.isDefault;
  if (makeDefault && !first) await Address.updateMany({ user: user._id }, { isDefault: false });
  const a = await Address.create({ ...d, user: user._id, isDefault: makeDefault });
  return ok({ address: a }, 201);
}, []);
