'use client';
import { useState } from 'react';
import Select from '@/components/Select';
import { api, inr, when } from '@/lib/client';
import { usePoll } from '@/lib/hooks';
import { Status } from '@/components/ui';
import { useApp } from '@/components/Providers';
const TABS = [['', 'Live & recent'], ['placed', 'New'], ['preparing', 'Preparing'], ['ready', 'Ready'], ['picked_up', 'On the way'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']];
export default function Orders() {
  const { ask } = useApp();
  const [tab, setTab] = useState(''), [orders, setOrders] = useState(null), [riders, setRiders] = useState([]), [err, setErr] = useState('');
  const load = async () => { try { const [o, r] = await Promise.all([api('/api/admin/orders' + (tab ? '?status=' + tab : '')), api('/api/admin/riders')]); setOrders(o.orders); setRiders(r.riders); } catch (e) { setErr(e.message); } };
  usePoll(load, 8000);
  const act = async (id, body) => { setErr(''); try { await api('/api/orders/' + id, { method: 'PATCH', body }); load(); } catch (e) { setErr(e.message); } };
  const idle = riders.filter((r) => r.approved && r.rider?.online && !r.rider?.busy);
  return (<><div className="tabs">{TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => { setTab(k); setOrders(null); setTimeout(load, 0); }}>{l}</button>)}</div>{err && <div className="err">{err}</div>}
    <div className="card tblw"><table className="tbl"><thead><tr><th>Order</th><th>Restaurant</th><th>Customer</th><th>Amount</th><th>Status</th><th>Rider</th><th></th></tr></thead><tbody>
      {!orders ? <tr><td colSpan="7" className="muted">Loading…</td></tr> : !orders.length ? <tr><td colSpan="7" className="muted">No orders.</td></tr> : orders.map((o) => { const closed = ['delivered', 'cancelled'].includes(o.status); return (<tr key={o._id}>
        <td>#{String(o._id).slice(-6).toUpperCase()}<div className="muted">{when(o.createdAt)}</div></td><td>{o.restaurant?.name}</td><td>{o.customer?.name}</td><td>{inr(o.total)}<div className="muted">{o.payment.method} · {o.payment.status}</div></td><td><Status s={o.status} /></td>
        <td>{closed ? o.rider?.name || '—' : <div className="row"><Select size="sm" value={o.rider?._id || ''} onChange={(e) => e.target.value && act(o._id, { action: 'assign', riderId: e.target.value })}><option value="">{o.rider ? o.rider.name : 'Assign rider…'}</option>{idle.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}</Select>
          {!o.rider && <button className="btn sm" onClick={() => act(o._id, { action: 'auto' })}>Auto</button>}</div>}</td>
        <td>{['placed', 'accepted', 'preparing', 'ready'].includes(o.status) && <button className="btn line sm" onClick={async () => (await ask({ title: 'Cancel this order?', message: 'The order will be cancelled and the customer refunded. This cannot be undone.', confirmText: 'Cancel order', cancelText: 'Keep order' })) && act(o._id, { action: 'cancel' })}>Cancel</button>}</td></tr>); })}</tbody></table></div></>);
}
