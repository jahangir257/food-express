import { handler, ok, HttpError } from '@/lib/api';
import { Image } from '@/lib/models';
const OK = ['image/jpeg', 'image/png', 'image/webp'];
export const POST = handler(async (req, { user }) => {
  const f = (await req.formData()).get('file');
  if (!f || typeof f === 'string') throw new HttpError('No file');
  if (!OK.includes(f.type)) throw new HttpError('Only JPG, PNG or WebP images');
  if (f.size > 1.5 * 1024 * 1024) throw new HttpError('Image must be under 1.5 MB');
  const img = await Image.create({ data: Buffer.from(await f.arrayBuffer()), contentType: f.type, owner: user._id });
  return ok({ url: `/api/images/${img._id}` }, 201);
}, ['restaurant', 'admin'], { key: 'upl', max: 40, windowMs: 3600e3 });
