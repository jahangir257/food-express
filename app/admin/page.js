'use client';
import Skeleton from '@/components/Skeleton';
import Link from 'next/link';
import { useState } from 'react';
import { api, inr } from '@/lib/client';
import { usePoll } from '@/lib/hooks';
import { BarChart, Kpi, PageHead } from '@/components/ui';
export default function Overview() {
  const [s, setS] = useState(null), [err, setErr] = useState('');
  usePoll(() => api('/api/admin/stats').then(setS).catch((e) => setErr(e.message)), 15000);
  if (!s) return err ? <p className="muted">{err}</p> : <Skeleton type="dash" />;
  const k = [['rupee', 'GMV (delivered)', inr(s.gmv)], ['chart', 'Commission earned', inr(s.commission)], ['truck', 'Delivery revenue', inr(s.deliveryRevenue)], ['tag', 'Fees collected', inr(s.fees)], ['gift', 'Discounts given', inr(s.discounts)], ['bag', 'Delivered orders', s.delivered], ['list', 'Live orders', s.activeOrders], ['bike', 'Riders online', s.onlineRiders], ['store', 'Restaurants', s.restaurants], ['users', 'Customers', s.customers]];
  return (<><PageHead title="Overview" sub="Live snapshot of your marketplace" />
    <div className="kpis">{k.map(([i, l, v]) => <Kpi key={l} icon={i} label={l} value={v} />)}</div>
    <div className="row gap wrap" style={{ alignItems: 'stretch' }}>
      <div className="card grow" style={{ minWidth: 320 }}><div className="ch"><h3>Sales — last 14 days</h3></div>{s.daily.length ? <BarChart data={s.daily} fmt={(v) => '₹' + Math.round(v)} /> : <p className="muted">No delivered orders yet.</p>}</div>
      <div className="card" style={{ minWidth: 280 }}><div className="ch"><h3>Needs attention</h3></div><div className="col">
        {[['/admin/restaurants', 'Restaurants pending approval', s.pendingRestaurants], ['/admin/riders', 'Riders pending approval', s.pendingRiders], ['/admin/orders', 'Orders without a rider', s.unassigned], ['/admin/payouts', 'Restaurants awaiting payout', s.manualPayoutsDue.length]].map(([h, l, n]) => <Link key={h} href={h} className="row between"><span>{l}</span><span className={'pill' + (n ? ' p' : '')}>{n}</span></Link>)}</div></div></div></>);
}
