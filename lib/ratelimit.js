// Simple in-memory limiter (use Redis/Upstash when running multiple instances)
const m = new Map();
export function hit(key, max, windowMs) {
  const now = Date.now();
  const e = m.get(key);
  if (!e || e.reset < now) { m.set(key, { n: 1, reset: now + windowMs }); if (m.size > 5000) for (const [k, v] of m) if (v.reset < now) m.delete(k); return true; }
  return ++e.n <= max;
}
