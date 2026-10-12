import { handler, ok, bad, str } from '@/lib/api';
import { gemini } from '@/lib/gemini';
export const POST = handler(async (req) => {
  const b = await req.json();
  const name = str(b.name, 100); if (!name) return bad('Dish name required');
  const raw = await gemini(`Dish: ${name}. Category: ${str(b.category, 40)}. Veg: ${b.veg ? 'yes' : 'no'}. Write a mouth-watering menu description (max 30 words) and up to 5 short lowercase tags. Respond as JSON {"description":string,"tags":string[]}.`, { json: true });
  try { const j = JSON.parse(raw); return ok({ description: str(j.description, 400), tags: (j.tags || []).slice(0, 5).join(', ') }); }
  catch { return ok({ description: str(raw, 300), tags: '' }); }
}, ['restaurant'], { key: 'desc', max: 30, windowMs: 60e3 });
