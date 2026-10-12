'use client';
import Skeleton from '@/components/Skeleton';
import Link from 'next/link';
import { useState } from 'react';
import { api, inr } from '@/lib/client';
import { usePoll } from '@/lib/hooks';
import { BarChart, Kpi, PageHead, Toggle } from '@/components/ui';
export default function Dash() {
  const [d, setD] = useState(null), [r, setR] = useState(null), [err, setErr] = useState('');
  usePoll(() => { api('/api/partner/orders').then(setD).catch((e) => setErr(e.message)); api('/api/partner/restaurant').then((x) => setR(x.restaurant)); }, 15000);
  if (!d || !r) return err ? <p className="muted">{err}</p> : <Skeleton type="dash" />;
  const toggle = async (v) => { await api('/api/partner/restaurant', { method: 'PUT', body: { isOpen: v } }); setR({ ...r, isOpen: v }); };
  const s = d.stats;
  return (<>{!r.approved && <div className="card" style={{ marginBottom: 16, borderColor: 'var(--p)' }}>Your restaurant is awaiting admin approval. You can set up your menu meanwhile — it goes live once approved.</div>}
    <div className="card row between" style={{ marginBottom: 16 }}><div><h3>{r.name}</h3><div className="muted">{r.isOpen ? 'Accepting orders' : 'Not accepting orders'}</div></div><Toggle on={r.isOpen} onChange={toggle} /></div>
    {s.pending > 0 && <Link href="/partner/orders" className="card row between" style={{ marginBottom: 16, borderColor: 'var(--p)' }}><b className="p">{s.pending} new order{s.pending > 1 ? 's' : ''} waiting</b><span className="btn sm">View</span></Link>}
    <div className="kpis">{[['bag', "Today's orders", s.todayOrders], ['rupee', "Today's earnings", inr(s.todayEarnings)], ['chart', 'Total earnings', inr(s.earnings)], ['clock', 'Pending transfer', inr(s.held)], ['bank', 'Awaiting manual payout', inr(s.due)]].map(([i, l, v]) => <Kpi key={l} icon={i} label={l} value={v} />)}</div>
    <div className="row gap wrap" style={{ alignItems: 'stretch' }}><div className="card grow" style={{ minWidth: 300 }}><h3>Earnings — last 7 days</h3><BarChart data={d.daily} fmt={(v) => '₹' + Math.round(v)} /></div>
      <div className="card" style={{ minWidth: 260 }}><h3>Top dishes</h3>{!d.top.length ? <p className="muted">No data yet.</p> : d.top.map(([n, q]) => <div key={n} className="row between" style={{ margin: '10px 0' }}><span>{n}</span><b>{q}</b></div>)}</div></div></>);
}
