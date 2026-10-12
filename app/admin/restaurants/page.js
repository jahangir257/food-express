'use client';
import Skeleton from '@/components/Skeleton';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { Img, Toggle } from '@/components/ui';
export default function Restaurants() {
  const [rs, setRs] = useState(null), [err, setErr] = useState(''), [msg, setMsg] = useState('');
  const load = () => api('/api/admin/restaurants').then((d) => setRs(d.restaurants)).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  const patch = async (id, body) => { setErr(''); setMsg(''); try { await api('/api/admin/restaurants', { method: 'PATCH', body: { id, ...body } }); setMsg('Saved'); load(); } catch (e) { setErr(e.message); } };
  if (!rs) return err ? <p className="muted">{err}</p> : <Skeleton type="list" />;
  return (<>{err && <div className="err">{err}</div>}{msg && <div className="muted">{msg}</div>}<div className="col">{rs.map((r) => (
    <div key={r._id} className="card"><div className="row wrap" style={{ alignItems: 'flex-start' }}>
      <Img src={r.image} style={{ width: 90, height: 90, borderRadius: 12, objectFit: 'cover', flex: 'none' }} />
      <div className="grow" style={{ minWidth: 220 }}><h3>{r.name}</h3><div className="muted">{r.owner?.name} · {r.owner?.email} · {r.owner?.phone}</div><div className="muted">{r.address}</div>
        <div className="muted" style={{ marginTop: 6 }}>Bank: {r.bank?.beneficiary || '—'} · A/c {r.bank?.accountNumber || '—'} · IFSC {r.bank?.ifsc || '—'} · PAN {r.bank?.pan || '—'}</div></div>
      <div className="row"><span className="muted">{r.approved ? 'Approved' : 'Pending'}</span><Toggle on={r.approved} onChange={(v) => patch(r._id, { approved: v })} /></div></div>
      <div className="row wrap" style={{ marginTop: 14, alignItems: 'flex-end' }}>
        <div className="field" style={{ width: 130 }}><label>Commission %</label><input type="number" defaultValue={r.commissionPct} onBlur={(e) => +e.target.value !== r.commissionPct && patch(r._id, { commissionPct: +e.target.value })} /></div>
        <div className="field grow" style={{ minWidth: 220 }}><label>Razorpay linked account</label><input defaultValue={r.linkedAccountId || ''} placeholder="acc_XXXXXXXXXXXX" onBlur={(e) => e.target.value !== (r.linkedAccountId || '') && patch(r._id, { linkedAccountId: e.target.value })} /></div>
        <button className="btn line" onClick={() => patch(r._id, { createLinkedAccount: true })}>Create linked account via API</button></div></div>))}
    {!rs.length && <p className="muted">No restaurants yet.</p>}</div></>);
}
