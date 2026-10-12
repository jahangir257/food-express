'use client';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/client';
import LocationPicker from '@/components/LocationPicker';
import { Modal } from '@/components/ui';
export default function Register() {
  const [f, setF] = useState({ role: 'customer', name: '', email: '', phone: '', password: '', restaurantName: '', address: '', vehicle: '' }), [err, setErr] = useState(''), [msg, setMsg] = useState(''), [pick, setPick] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = async (e) => { e.preventDefault(); setErr('');
    try { const d = await api('/api/auth/register', { method: 'POST', body: f }); if (d.pending) setMsg(d.message); else location.href = '/'; } catch (e) { setErr(e.message); } };
  if (msg) return <div className="container" style={{ maxWidth: 480, paddingTop: 60 }}><div className="card"><h2>You’re all set</h2><p>{msg}</p><Link className="btn" href="/login">Go to login</Link></div></div>;
  return (<div className="auth"><div className="art" style={{ backgroundImage: 'linear-gradient(#0003,#0008),url(https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&q=70)' }}>Join the Foodie Express family.</div>
    <form onSubmit={go}><h1 style={{ fontSize: 30 }}>Sign up</h1>
      <div className="tabs" style={{ marginTop: 12 }}>{[['customer', 'Customer'], ['restaurant', 'Restaurant'], ['rider', 'Rider']].map(([v, l]) => <button type="button" key={v} className={f.role === v ? 'on' : ''} onClick={() => setF({ ...f, role: v })}>{l}</button>)}</div>
      {[['name', 'Full name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'tel'], ['password', 'Password (min 8 characters)', 'password']].map(([k, l, t]) => <div className="field" key={k}><label>{l}</label><input type={t} required minLength={k === 'password' ? 8 : undefined} value={f[k]} onChange={set(k)} /></div>)}
      {f.role === 'restaurant' && <><div className="field"><label>Restaurant name</label><input required value={f.restaurantName} onChange={set('restaurantName')} /></div>
        <div className="field"><label>Restaurant address</label><input required value={f.address} onChange={set('address')} /></div>
        <button type="button" className="btn line block" onClick={() => setPick(true)}>{f.lat ? '✓ Location set — change' : 'Pin restaurant location'}</button></>}
      {f.role === 'rider' && <div className="field"><label>Vehicle</label><input placeholder="Bike / Scooter" value={f.vehicle} onChange={set('vehicle')} /></div>}
      {err && <div className="err">{err}</div>}<button className="btn block" disabled={f.role === 'restaurant' && !f.lat} style={{ marginTop: 10 }}>Create account</button>
      <p className="muted">Have an account? <Link className="p" href="/login">Log in</Link></p></form>
    <Modal open={pick} onClose={() => setPick(false)} title="Restaurant location"><LocationPicker onPick={(l) => { setF({ ...f, lat: l.lat, lng: l.lng, address: f.address || l.label }); setPick(false); }} /></Modal></div>);
}
