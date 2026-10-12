'use client';
import Skeleton from '@/components/Skeleton';
import { useRef, useState } from 'react';
import { api, inr, when } from '@/lib/client';
import { usePoll } from '@/lib/hooks';
import { Status } from '@/components/ui';
const TABS = [['new', 'New', ['placed']], ['active', 'In kitchen', ['accepted', 'preparing']], ['ready', 'Ready / pickup', ['ready', 'picked_up']], ['done', 'Completed', ['delivered', 'cancelled']]];
const ACT = { placed: [['accept', 'Accept'], ['reject', 'Reject', 1]], accepted: [['preparing', 'Start preparing'], ['reject', 'Cancel', 1]], preparing: [['ready', 'Food is ready']] };
function beep() { try { const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(); o.frequency.value = 880; o.connect(c.destination); o.start(); setTimeout(() => { o.stop(); c.close(); }, 350); } catch {} }
export default function Orders() {
  const [tab, setTab] = useState('new'), [orders, setOrders] = useState(null), [err, setErr] = useState(''), seen = useRef(null);
  const load = () => api('/api/partner/orders').then((d) => { const ids = new Set(d.orders.filter((o) => o.status === 'placed').map((o) => o._id)); if (seen.current && [...ids].some((i) => !seen.current.has(i))) beep(); seen.current = ids; setOrders(d.orders); }).catch((e) => setErr(e.message));
  usePoll(load, 6000);
  const act = async (id, action) => { setErr(''); try { await api('/api/orders/' + id, { method: 'PATCH', body: { action } }); load(); } catch (e) { setErr(e.message); } };
  const cur = TABS.find((t) => t[0] === tab), list = (orders || []).filter((o) => cur[2].includes(o.status));
  return (<><div className="tabs">{TABS.map(([k, l, st]) => { const n = (orders || []).filter((o) => st.includes(o.status)).length; return <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}{k !== 'done' && n ? ` (${n})` : ''}</button>; })}</div>{err && <div className="err">{err}</div>}
    {!orders ? <Skeleton type="list" /> : !list.length ? <p className="muted">No orders here.</p> : <div className="rgrid" style={{ gap: 16 }}>{list.map((o) => (
      <div key={o._id} className={'ocard' + (o.status === 'placed' ? ' new' : '')}><div className="row between"><b>#{String(o._id).slice(-6).toUpperCase()}</b><Status s={o.status} /></div>
        <div className="muted">{when(o.createdAt)} · {o.customer?.name}</div>
        <div style={{ margin: '10px 0' }}>{o.items.map((i, k) => <div key={k}>{i.qty} × {i.name}</div>)}</div>{o.notes && <div className="muted">“{o.notes}”</div>}
        <div className="row between" style={{ margin: '8px 0' }}><span className="muted">Your payout</span><b>{inr(o.restaurantShare)}</b></div>
        {o.rider && !['delivered', 'cancelled'].includes(o.status) && <div className="muted">Rider: {o.rider.name}</div>}
        <div className="row wrap" style={{ marginTop: 8 }}>{(ACT[o.status] || []).map(([a, l, g]) => <button key={a} className={'btn sm' + (g ? ' line' : '')} onClick={() => act(o._id, a)}>{l}</button>)}</div></div>))}</div>}</>);
}
