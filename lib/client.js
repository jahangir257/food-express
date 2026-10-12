export async function api(path, opts = {}) {
  const res = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json' }, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
export const inr = (n) => '₹' + Number(n || 0).toFixed(2).replace(/\.00$/, '');
export const when = (d) => new Date(d).toLocaleString('en-IN', { timeZone: process.env.NEXT_PUBLIC_APP_TIMEZONE || 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
export const getPosition = () => new Promise((res, rej) => navigator.geolocation ? navigator.geolocation.getCurrentPosition((p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }), () => rej(new Error('Location permission denied')), { enableHighAccuracy: true, timeout: 10000 }) : rej(new Error('Geolocation unsupported')));

export const offerText = (c) => (c.type === 'percent' ? `${c.value}% OFF${c.maxDiscount ? ` up to ₹${c.maxDiscount}` : ''}` : `₹${c.value} OFF`) + (c.minOrder ? ` on orders above ₹${c.minOrder}` : '');
