import { handler, ok, bad, str } from '@/lib/api';
import { Image } from '@/lib/models';
import { geminiImage } from '@/lib/gemini';
export const POST = handler(async (req, { user }) => {
  const p = str((await req.json()).prompt, 120); if (!p) return bad('Prompt required');
  const { data, contentType } = await geminiImage(`Professional appetizing food photography of ${p}, top-down, natural light, clean background, no text, no watermark.`);
  const img = await Image.create({ data, contentType, owner: user._id });
  return ok({ url: `/api/images/${img._id}` });
}, ['restaurant', 'admin'], { key: 'aiimg', max: 15, windowMs: 3600e3 });
