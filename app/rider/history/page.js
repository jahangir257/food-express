'use client';
import Skeleton from '@/components/Skeleton';
import { useEffect, useState } from 'react';
import { api, inr, when } from '@/lib/client';
export default function History() {
  const [h, setH] = useState(null);
  useEffect(() => { api('/api/rider/orders?history=1').then((d) => setH(d.history)); }, []);
  if (!h) return <Skeleton type="list" />;
  return (<><div className="card kpi" style={{ marginBottom: 14 }}><div className="l">Earned (last {h.length} deliveries)</div><div className="v">{inr(h.reduce((s, x) => s + x.earning, 0))}</div></div>
    <div className="col">{!h.length && <div className="card muted">No completed deliveries yet.</div>}{h.map((x) => <div key={x._id} className="card row between"><div><b>{x.restaurant?.name}</b><div className="muted">{when(x.updatedAt)} · {x.distanceKm} km</div></div><b>{inr(x.earning)}</b></div>)}</div></>);
}
