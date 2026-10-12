'use client';
import Skeleton from '@/components/Skeleton';
import { useEffect, useRef, useState } from 'react';
import { api, inr } from '@/lib/client';
import { usePoll } from '@/lib/hooks';
import { Status, Toggle } from '@/components/ui';
export default function Rider() {
  const [d, setD] = useState(null), [err, setErr] = useState(''), [gps, setGps] = useState(''), last = useRef(0);
  const load = () => api('/api/rider/orders').then(setD).catch((e) => setErr(e.message));
  usePoll(load, 7000);
  useEffect(() => {
    if (!d?.online || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition((p) => {
      setGps('Location sharing on'); if (Date.now() - last.current < 8000) return; last.current = Date.now();
      api('/api/rider/location', { method: 'POST', body: { lat: p.coords.latitude, lng: p.coords.longitude } }).catch(() => {});
    }, () => setGps('Allow location access to get orders'), { enableHighAccuracy: true });
    return () => navigator.geolocation.clearWatch(id);
  }, [d?.online]);
  const toggle = async (v) => { await api('/api/rider/status', { method: 'POST', body: { online: v } }); load(); };
  const act = async (id, action) => { setErr(''); try { await api('/api/orders/' + id, { method: 'PATCH', body: { action } }); load(); } catch (e) { setErr(e.message); } };
  if (!d) return err ? <p className="muted">{err}</p> : <Skeleton type="list" />;
  const bkey = (o) => `${o.address.location.coordinates[1].toFixed(3)},${o.address.location.coordinates[0].toFixed(3)}`;
  const grouped = {}; d.active.forEach((o) => { (grouped[bkey(o)] ||= []).push(o); });
  const batches = Object.entries(grouped).filter(([, g]) => g.length > 1);
  const nav = (c) => `https://www.google.com/maps/dir/?api=1&destination=${c[1]},${c[0]}`;
  return (<>{err && <div className="err">{err}</div>}
    <div className="card row between"><div><h3>{d.online ? 'You’re online' : 'You’re offline'}</h3><div className="muted">{d.online ? gps || 'Starting GPS…' : 'Go online to receive orders'}</div></div><Toggle on={d.online} onChange={toggle} /></div>
    <div className="kpis" style={{ marginTop: 14, gridTemplateColumns: '1fr 1fr' }}><div className="card kpi"><div className="l">Deliveries</div><div className="v">{d.delivered}</div></div><div className="card kpi"><div className="l">Total earnings</div><div className="v">{inr(d.earnings)}</div></div></div>
    <h3 style={{ margin: '8px 0' }}>Active delivery</h3>{!d.active.length && <div className="card muted">{d.online ? 'Waiting for the next order near you…' : 'No active orders.'}</div>}
    {batches.length > 0 && batches.map(([k, g]) => <div key={k} className="rbatch"><b>Combined delivery · {g.length} pickups, one drop</b><div className="muted">{g.map((o) => o.restaurant.name).join(' → ')} → {g[0].customer?.name || 'customer'}. Collect all orders before delivering.</div></div>)}
    <div className="col">{d.active.map((o) => <div key={o._id} className="card"><div className="row between"><b>#{String(o._id).slice(-6).toUpperCase()}</b><Status s={o.status} /></div>
      <div style={{ margin: '12px 0' }}><div className="muted">PICKUP</div><b>{o.restaurant.name}</b><div className="muted">{o.restaurant.address}</div><a className="btn line sm" style={{ marginTop: 6 }} href={nav(o.restaurant.location.coordinates)} target="_blank" rel="noreferrer">Navigate</a></div>
      <div style={{ margin: '12px 0' }}><div className="muted">DROP</div><b>{o.customer?.name}</b><div className="muted">{o.address.line}</div><div className="row" style={{ marginTop: 6 }}><a className="btn line sm" href={nav(o.address.location.coordinates)} target="_blank" rel="noreferrer">Navigate</a><a className="btn line sm" href={'tel:' + o.address.phone}>Call</a></div></div>
      {o.payment.method === 'cod' && <div className="pill p" style={{ marginBottom: 8 }}>Collect cash {inr(o.total)}</div>}
      {o.status === 'ready' && <button className="btn block" onClick={() => act(o._id, 'pickup')}>Picked up from restaurant</button>}
      {o.status === 'picked_up' && <button className="btn block" onClick={() => act(o._id, 'deliver')}>Delivered to customer</button>}
      {['accepted', 'preparing'].includes(o.status) && <div className="muted">Restaurant is still preparing. Head to pickup.</div>}</div>)}</div></>);
}
