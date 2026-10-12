import mongoose from 'mongoose';
import { db } from '@/lib/db';
import { Image } from '@/lib/models';
export const GET = async (_req, { params }) => {
  if (!mongoose.isValidObjectId(params.id)) return new Response('Not found', { status: 404 });
  await db();
  const img = await Image.findById(params.id);
  if (!img) return new Response('Not found', { status: 404 });
  return new Response(img.data, { headers: { 'Content-Type': img.contentType, 'Cache-Control': 'public, max-age=31536000, immutable' } });
};
