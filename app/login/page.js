'use client';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/client';
import { useApp } from '@/components/Providers';
const HOME = { admin: '/admin', restaurant: '/partner', rider: '/rider', customer: '/' };
export default function Login() {
  const { setUser } = useApp();
  const [f, setF] = useState({ email: '', password: '' }), [err, setErr] = useState('');
  const go = async (e) => { e.preventDefault(); setErr('');
    try { const d = await api('/api/auth/login', { method: 'POST', body: f }); setUser(d.user);
      const next = new URLSearchParams(location.search).get('next'); location.href = d.user.role === 'customer' && next?.startsWith('/') ? next : HOME[d.user.role]; } catch (e) { setErr(e.message); } };
  return (<div className="auth"><div className="art" style={{ backgroundImage: 'linear-gradient(#0003,#0008),url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000&q=70)' }}>Good food is always a tap away.</div>
    <form onSubmit={go}><h1 style={{ fontSize: 30 }}>Log in</h1><p className="muted">Customers, restaurant partners, riders and admins use the same login.</p>
      <div className="field"><label>Email</label><input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      <div className="field"><label>Password</label><input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
      {err && <div className="err">{err}</div>}<button className="btn block" style={{ marginTop: 10 }}>Log in</button>
      <p className="muted">New here? <Link className="p" href="/register">Create an account</Link></p></form></div>);
}
