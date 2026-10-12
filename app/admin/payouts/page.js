'use client';
import Skeleton from '@/components/Skeleton';
import { useEffect, useState } from 'react';
import { api, inr, when } from '@/lib/client';
import { useApp } from '@/components/Providers';
export default function Payouts() {
  const { ask } = useApp();
  const [o, setO] = useState(null), [err, setErr] = useState('');
  const load = () => api('/api/admin/orders?payout=manual_due').then((d) => setO(d.orders.filter((x) => x.status === 'delivered')));
  useEffect(() => { load(); }, []);
  const pay = async (ids) => { setErr(''); try { await api('/api/admin/orders', { method: 'PATCH', body: { ids } }); load(); } catch (e) { setErr(e.message); } };
  if (!o) return <Skeleton type="list" />;
  const by = {}; o.forEach((x) => { const k = x.restaurant?.name || '—'; (by[k] ||= []).push(x); });
  return (<><div className="card" style={{ marginBottom: 16 }}><b>How payouts work.</b> <span className="muted">Online orders with a linked Razorpay account are transferred automatically after delivery. Orders below (cash on delivery, or no linked account) need a manual bank transfer — then mark them paid.</span></div>{err && <div className="err">{err}</div>}
    {!Object.keys(by).length && <p className="muted">Nothing due. 🎉</p>}
    <div className="col">{Object.entries(by).map(([name, list]) => { const sum = list.reduce((s, x) => s + x.restaurantShare, 0); return (<div key={name} className="card"><div className="row between"><h3>{name}</h3><div className="row"><b>{inr(sum)}</b><button className="btn sm" onClick={async () => (await ask({ tone: 'primary', title: 'Mark as paid?', message: `Confirm that ${inr(sum)} has been transferred to ${name}.`, confirmText: 'Mark paid' })) && pay(list.map((x) => x._id))}>Mark all paid</button></div></div>
      <div className="muted" style={{ marginTop: 8 }}>{list.map((x) => `#${String(x._id).slice(-6).toUpperCase()} (${inr(x.restaurantShare)}, ${when(x.createdAt)})`).join(' · ')}</div></div>); })}</div></>);
}
