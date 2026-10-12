'use client';
import { useState } from 'react';
import { api } from '@/lib/client';
import { MapPin, ShoppingCart, User, Users, Search, Star, Clock, Home, ShoppingBag, Store, Bike, ListChecks, BarChart3, Tag, IndianRupee, LayoutGrid, LogOut, Sparkles, Settings, Gift, Truck, ChevronDown, Landmark, Pencil, X, Menu, Plus, Trash2, UserCog, Mail, Phone, Lock, Save, Utensils, Flame, Percent, Camera, Heart, UtensilsCrossed, Receipt } from 'lucide-react';
const ICONS = { pin: MapPin, cart: ShoppingCart, user: User, users: Users, search: Search, star: Star, clock: Clock, home: Home, bag: ShoppingBag, store: Store, bike: Bike, list: ListChecks, chart: BarChart3, tag: Tag, rupee: IndianRupee, grid: LayoutGrid, logout: LogOut, spark: Sparkles, cog: Settings, gift: Gift, truck: Truck, chev: ChevronDown, bank: Landmark, pencil: Pencil, x: X, menu: Menu, plus: Plus, trash: Trash2, profile: UserCog, mail: Mail, phone: Phone, lock: Lock, save: Save, food: Utensils, flame: Flame, percent: Percent, camera: Camera, heart: Heart };
export const Icon = ({ n, s = 20 }) => { const C = ICONS[n]; return C ? <C size={s} strokeWidth={1.9} fill={n === 'star' ? 'currentColor' : 'none'} /> : null; };
export function Img({ src, alt = '', className, emoji = '🍽️', style }) {
  const [bad, setBad] = useState(false);
  if (!src || bad) return <div className={'imgfb ' + (className || '')} style={style}>{emoji}</div>;
  return <img src={src} alt={alt} loading="lazy" className={className} style={style} onError={() => setBad(true)} />;
}
export const Veg = ({ veg }) => <span className={'veg ' + (veg ? 'v' : 'n')}><i /></span>;
export const Rating = ({ v }) => <span className="rating"><Icon n="star" s={11} />{Number(v || 0).toFixed(1)}</span>;
const L = { pending_payment: 'Awaiting payment', placed: 'New order', accepted: 'Accepted', preparing: 'Preparing', ready: 'Ready for pickup', picked_up: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled' };
export const statusLabel = (s) => L[s] || s;
export const Status = ({ s }) => <span className={'pill' + (['placed', 'picked_up'].includes(s) ? ' p' : s === 'cancelled' ? '' : '')} style={s === 'delivered' ? { background: '#1c1c1c', color: '#fff' } : undefined}>{L[s] || s}</span>;
const EMPTY_ICONS = [[/categor/i, LayoutGrid], [/dish|product|item|menu/i, UtensilsCrossed], [/restaurant|kitchen|store/i, Store], [/order/i, Receipt], [/favou?rite/i, Heart], [/coupon|offer/i, Tag], [/address|location/i, MapPin], [/cart/i, ShoppingCart]];
export const Empty = ({ title = '', sub, icon, children }) => { const I = icon || (EMPTY_ICONS.find(([r]) => r.test(title)) || [0, Search])[1]; return <div className="empty"><div className="empty-ic"><I size={34} strokeWidth={1.6} /></div><h3>{title}</h3><p>{sub}</p>{children}</div>; };
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return <div className="ovl" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal"><div className="row between" style={{ marginBottom: 12 }}><h3 style={{ fontSize: 20 }}>{title}</h3><button className="btn line sm" onClick={onClose}><Icon n="x" s={16} /></button></div>{children}</div></div>;
}
export const Toggle = ({ on, onChange }) => <button type="button" className={'sw' + (on ? ' on' : '')} onClick={() => onChange(!on)} aria-pressed={on} />;
export function ImageField({ value, onChange, prompt, label = 'Image' }) {
  const [busy, setBusy] = useState(''), [err, setErr] = useState('');
  const upload = async (e) => {
    const f = e.target.files[0]; if (!f) return; setBusy('up'); setErr('');
    try { const fd = new FormData(); fd.append('file', f); const r = await fetch('/api/upload', { method: 'POST', body: fd }); const d = await r.json(); if (!r.ok) throw new Error(d.error); onChange(d.url); } catch (x) { setErr(x.message); } setBusy('');
  };
  const gen = async () => { if (!prompt) return setErr('Enter a name first'); setBusy('ai'); setErr(''); try { onChange((await api('/api/ai/image', { method: 'POST', body: { prompt } })).url); } catch (x) { setErr(x.message); } setBusy(''); };
  return (<div className="field"><label>{label}</label><div className="row">
    <Img src={value} className="" style={{ width: 84, height: 84, borderRadius: 12, objectFit: 'cover', flex: 'none' }} />
    <div className="col grow"><div className="row wrap"><label className="btn line sm" style={{ cursor: 'pointer' }}>{busy === 'up' ? 'Uploading…' : 'Upload'}<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={upload} /></label>
      <button type="button" className="btn line sm" onClick={gen} disabled={!!busy}><Icon n="spark" s={15} />{busy === 'ai' ? 'Generating…' : 'Generate with AI'}</button></div>
      <input placeholder="or paste image URL" value={value || ''} onChange={(e) => onChange(e.target.value)} /></div></div>{err && <div className="err">{err}</div>}</div>);
}
export function BarChart({ data, fmt = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return <div className="bars">{data.map((d) => <div className="b" key={d.label} title={fmt(d.value)}><span>{d.value ? fmt(d.value) : ''}</span><i style={{ height: `${(d.value / max) * 100}%` }} /><span>{d.label}</span></div>)}</div>;
}

export const Kpi = ({ icon, label, value }) => <div className="card kpi"><div className="ic"><Icon n={icon} s={22} /></div><div><div className="l">{label}</div><div className="v">{value}</div></div></div>;
export const PageHead = ({ title, sub, children }) => <div className="ph"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div><div className="row">{children}</div></div>;
export const Stepper = ({ q, onMinus, onPlus }) => <span className="step"><button onClick={onMinus} aria-label="Remove one">−</button><b>{q}</b><button onClick={onPlus} aria-label="Add one">+</button></span>;
