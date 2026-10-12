'use client';
import Skeleton from '@/components/Skeleton';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { ImageField, Modal, Toggle } from '@/components/ui';
import LocationPicker from '@/components/LocationPicker';
export default function Profile() {
  const [r, setR] = useState(null), [msg, setMsg] = useState(''), [err, setErr] = useState(''), [pick, setPick] = useState(false), [pos, setPos] = useState(null);
  useEffect(() => { api('/api/partner/restaurant').then((d) => { setR({ ...d.restaurant, cuisines: (d.restaurant.cuisines || []).join(', ') }); }); }, []);
  if (!r) return <Skeleton type="list" />;
  const set = (k) => (e) => setR({ ...r, [k]: e.target.value });
  const save = async (e) => { e.preventDefault(); setErr(''); setMsg(''); try { await api('/api/partner/restaurant', { method: 'PUT', body: { name: r.name, description: r.description, address: r.address, image: r.image, logo: r.logo, offer: r.offer, charges: (r.charges || []).filter((c) => c.name), cuisines: r.cuisines, pureVeg: r.pureVeg, isOpen: r.isOpen, deliveryRadiusKm: r.deliveryRadiusKm, prepMinutes: r.prepMinutes, ...(pos ? { lat: pos.lat, lng: pos.lng } : {}) } }); setMsg('Saved'); } catch (x) { setErr(x.message); } };
  return (<form className="card" style={{ maxWidth: 680 }} onSubmit={save}>
    <ImageField value={r.logo} onChange={(v) => setR({ ...r, logo: v })} prompt={r.name && `${r.name} restaurant logo, simple round emblem`} label="Restaurant logo (square)" />
      <ImageField value={r.image} onChange={(v) => setR({ ...r, image: v })} prompt={r.name && `${r.name} restaurant ${r.cuisines}`} label="Cover photo" />
    <div className="field"><label>Restaurant name</label><input required value={r.name} onChange={set('name')} /></div>
    <div className="field"><label>About</label><textarea rows={2} value={r.description || ''} onChange={set('description')} /></div>
    <div className="field"><label>Cuisines (comma separated, e.g. Biryani, Chinese)</label><input value={r.cuisines} onChange={set('cuisines')} /></div>
    <div className="field"><label>Offer banner (e.g. 20% OFF up to ₹100)</label><input value={r.offer || ''} onChange={set('offer')} /></div>
    <div className="field"><div className="row between"><label style={{ margin: 0 }}>Your additional charges (shown at checkout, paid to you)</label><button type="button" className="btn line sm" onClick={() => setR({ ...r, charges: [...(r.charges || []), { name: '', amount: '' }] })}>+ Add</button></div>
      {(r.charges || []).map((c, i) => <div key={i} className="row" style={{ marginTop: 8 }}><input placeholder="e.g. Packaging charge" value={c.name} onChange={(e) => setR({ ...r, charges: r.charges.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} /><input type="number" min="0" style={{ maxWidth: 120 }} placeholder="₹" value={c.amount} onChange={(e) => setR({ ...r, charges: r.charges.map((x, j) => j === i ? { ...x, amount: e.target.value } : x) })} /><button type="button" className="btn line sm" onClick={() => setR({ ...r, charges: r.charges.filter((_, j) => j !== i) })}>✕</button></div>)}</div>
    <div className="row"><div className="field grow"><label>Delivery radius (km)</label><input type="number" min="1" max="15" value={r.deliveryRadiusKm} onChange={set('deliveryRadiusKm')} /></div><div className="field grow"><label>Prep time (min)</label><input type="number" min="5" value={r.prepMinutes} onChange={set('prepMinutes')} /></div></div>
    <div className="field"><label>Address</label><input value={r.address || ''} onChange={set('address')} /></div>
    <div className="row" style={{ margin: '8px 0' }}><button type="button" className="btn line sm" onClick={() => setPick(true)}>{pos ? '✓ New location chosen' : 'Update map location'}</button></div>
    <div className="row" style={{ margin: '12px 0' }}><span className="grow">Pure vegetarian restaurant</span><Toggle on={!!r.pureVeg} onChange={(v) => setR({ ...r, pureVeg: v })} /></div>
    <div className="row" style={{ margin: '12px 0' }}><span className="grow">Accepting orders</span><Toggle on={!!r.isOpen} onChange={(v) => setR({ ...r, isOpen: v })} /></div>
    {err && <div className="err">{err}</div>}{msg && <div className="muted">{msg}</div>}<button className="btn" style={{ marginTop: 10 }}>Save changes</button>
    <Modal open={pick} onClose={() => setPick(false)} title="Restaurant location"><LocationPicker onPick={(l) => { setPos(l); setR({ ...r, address: r.address || l.label }); setPick(false); }} /></Modal></form>);
}
