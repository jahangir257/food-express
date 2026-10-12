import mongoose from 'mongoose';
const c = global._mongoose || (global._mongoose = { conn: null, p: null });
export async function db() {
  if (c.conn) return c.conn;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  c.p ||= mongoose.connect(process.env.MONGODB_URI, { maxPoolSize: 10 });
  c.conn = await c.p;
  return c.conn;
}
