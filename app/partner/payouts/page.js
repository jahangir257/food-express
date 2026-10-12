'use client';
import Skeleton from '@/components/Skeleton';
import { useEffect, useState } from 'react';
import { api, inr, when } from '@/lib/client';
export default function Payouts() {
  const [r, setR] = useState(null), [d, setD] = useState(null), [msg, setMsg] = useState(''), [err, setErr] = useState('');
  useEffect(() => { api('/api/partner/restaurant').then((x) => setR(x.restaurant)); api('/api/partner/orders').then(setD); }, []);
  if (!r || !d) return <Skeleton type="list" />;
  const b = r.bank || {}, setB = (k) => (e) => setR({ ...r, bank: { ...b, [k]: e.target.value } });
  const save = async (e) => { e.preventDefault(); setErr(''); setMsg(''); try { await api('/api/partner/restaurant', { method: 'PUT', body: { bank: b } }); setMsg('Saved. Admin will verify and link your payout account.'); } catch (x) { setErr(x.message); } };
  const done = d.orders.filter((o) => o.status === 'delivered');
  const L = { held: 'Releasing after delivery', released: 'Sent to bank', manual_due: 'Pending transfer', manual_paid: 'Paid', none: '—' };
  return (<div className="row gap wrap" style={{ alignItems: 'flex-start' }}>
    <form className="card" style={{ flex: '1 1 340px' }} onSubmit={save}><h3>Payout bank account</h3><p className="muted">Customer payments reach the platform first; your share (after commission) is paid here once the order is delivered.</p>
      <p>{r.linkedAccountId ? <span className="pill dark">Payout account linked</span> : <span className="pill">Verification pending</span>}</p>
      {[['legalName', 'Legal / business name'], ['beneficiary', 'Account holder name'], ['accountNumber', 'Account number'], ['ifsc', 'IFSC code'], ['pan', 'PAN'], ['gst', 'GSTIN (optional)'], ['street', 'Street'], ['city', 'City'], ['state', 'State'], ['pincode', 'Pincode']].map(([k, l]) => <div className="field" key={k}><label>{l}</label><input value={b[k] || ''} onChange={setB(k)} /></div>)}
      {err && <div className="err">{err}</div>}{msg && <div className="muted">{msg}</div>}<button className="btn">Save bank details</button></form>
    <div className="card tblw" style={{ flex: '2 1 380px' }}><h3 style={{ marginBottom: 8 }}>Recent earnings</h3><table className="tbl"><thead><tr><th>Order</th><th>Date</th><th>Your share</th><th>Payout</th></tr></thead><tbody>
      {done.slice(0, 40).map((o) => <tr key={o._id}><td>#{String(o._id).slice(-6).toUpperCase()}</td><td>{when(o.createdAt)}</td><td>{inr(o.restaurantShare)}</td><td>{L[o.payment.payout]}</td></tr>)}{!done.length && <tr><td colSpan="4" className="muted">No completed orders yet.</td></tr>}</tbody></table></div></div>);
}
