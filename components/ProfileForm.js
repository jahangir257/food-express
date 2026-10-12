'use client';
import { useEffect, useState } from 'react';
import Skeleton from './Skeleton';
import { api } from '@/lib/client';
import { useApp } from './Providers';
import { Icon } from './ui';
export default function ProfileForm() {
  const { user, setUser } = useApp();
  const [f, setF] = useState(null), [msg, setMsg] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { api('/api/auth/profile').then((d) => setF({ ...d.user, phone: d.user.phone || '', vehicle: d.user.vehicle || '', currentPassword: '', newPassword: '' })); }, []);
  if (!f) return <Skeleton type="list" />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => { e.preventDefault(); setErr(''); setMsg(''); setBusy(true);
    try { const d = await api('/api/auth/profile', { method: 'PUT', body: f }); setUser({ ...user, ...d.user }); setF({ ...f, currentPassword: '', newPassword: '' }); setMsg('Profile updated'); } catch (x) { setErr(x.message); } setBusy(false); };
  return (<form className="card pform" onSubmit={save}>
    <div className="pf-head"><span className="av big">{f.name?.[0]?.toUpperCase()}</span><div><h3>{f.name}</h3><span className="pill p" style={{ textTransform: 'capitalize' }}>{f.role}</span></div></div>
    <div className="fg">
      <div className="field"><label>Full name</label><input required value={f.name} onChange={set('name')} /></div>
      <div className="field"><label>Phone</label><input value={f.phone} onChange={set('phone')} /></div>
      <div className="field"><label>Email (cannot be changed)</label><input value={f.email} disabled /></div>
      {f.role === 'rider' && <div className="field"><label>Vehicle</label><input value={f.vehicle} onChange={set('vehicle')} placeholder="e.g. Bike WB 02 AB 1234" /></div>}
    </div>
    <h4 style={{ margin: '14px 0 2px', fontSize: 17 }}>Change password <span className="muted">(optional)</span></h4>
    <div className="fg"><div className="field"><label>Current password</label><input type="password" autoComplete="current-password" value={f.currentPassword} onChange={set('currentPassword')} /></div>
      <div className="field"><label>New password</label><input type="password" autoComplete="new-password" value={f.newPassword} onChange={set('newPassword')} /></div></div>
    {err && <div className="err">{err}</div>}{msg && <div className="okmsg">{msg}</div>}
    <button className="btn" style={{ marginTop: 12 }} disabled={busy}><Icon n="save" s={17} />{busy ? 'Saving…' : 'Save changes'}</button>
  </form>);
}
