'use client';
import Skeleton from '@/components/Skeleton';
import { useState } from 'react';
import { api, inr } from '@/lib/client';
import { useApp } from '@/components/Providers';
import { usePoll } from '@/lib/hooks';
import { Status } from '@/components/ui';
import TrackMap from '@/components/TrackMap';
import Link from 'next/link';
import { ReviewBox } from '@/components/Reviews';
const STEPS = [['placed', 'Order placed'], ['accepted', 'Restaurant accepted'], ['preparing', 'Preparing your food'], ['ready', 'Ready for pickup'], ['picked_up', 'Out for delivery'], ['delivered', 'Delivered']];
export default function Track({ params }) {
  const { ask } = useApp(), [o, setO] = useState(null), [err, setErr] = useState('');
  const load = () => api('/api/orders/' + params.id).then((d) => setO(d.order)).catch((e) => setErr(e.message));
  usePoll(load, 5000);
  if (err) return <div className="container"><p className="err" style={{ padding: 30 }}>{err}</p></div>;
  if (!o) return <Skeleton type="order" />;
  const idx = STEPS.findIndex((s) => s[0] === o.status), live = !['delivered', 'cancelled', 'pending_payment'].includes(o.status);
  const cancel = async () => { if (await ask({ title: 'Cancel this order?', message: 'Your order will be cancelled. If you paid online, the amount is refunded.', confirmText: 'Cancel order', cancelText: 'Keep order' })) { try { await api('/api/orders/' + o._id, { method: 'PATCH', body: { action: 'cancel' } }); load(); } catch (e) { setErr(e.message); } } };
  return (<div className="container" style={{ paddingTop: 24 }}>
    <div className="row between wrap"><div><h1 style={{ fontSize: 28 }}>{o.restaurant.name}</h1><div className="muted">Order #{String(o._id).slice(-6).toUpperCase()}</div></div><Status s={o.status} /></div>
    <div className="two">
      <div className="col">
        {live || o.status === 'delivered' ? <TrackMap restaurant={o.restaurant.location.coordinates} customer={o.address.location.coordinates} rider={o.rider?.rider?.location?.coordinates} /> : null}
        <div className="card">{o.status === 'cancelled' ? <p>This order was cancelled{o.payment.status === 'refunded' ? ' and your payment was refunded.' : '.'}</p> : o.status === 'pending_payment' ? <p>Waiting for payment confirmation…</p> :
          <ul className="tl">{STEPS.map(([k, l], i) => <li key={k} className={i <= idx ? 'on' : ''}>{l}</li>)}</ul>}</div>
      </div>
      <div className="col">
        {o.siblings?.length > 0 && <div className="card"><div className="muted">Part of a combined order — paid together</div>{o.siblings.map((x) => <Link key={x._id} href={'/orders/' + x._id} className="row between" style={{ margin: '8px 0' }}><b>{x.restaurant?.name}</b><Status s={x.status} /></Link>)}</div>}
        {o.status === 'delivered' && <ReviewBox order={o} onDone={load} />}
        {o.rider && <div className="card"><div className="muted">Your delivery partner</div><h3>{o.rider.name}</h3>{o.rider.phone && <a className="btn line sm" style={{ marginTop: 8 }} href={'tel:' + o.rider.phone}>Call rider</a>}</div>}
        {!o.rider && live && <div className="card muted">Finding a delivery partner near the restaurant…</div>}
        <div className="card"><h3>Bill</h3>{o.items.map((i, k) => <div key={k} className="row between" style={{ margin: '8px 0' }}><span>{i.qty}× {i.name}</span><span>{inr(i.price * i.qty)}</span></div>)}
          <div className="bill"><div><span>Item total</span><span>{inr(o.subtotal)}</span></div>{o.discount > 0 && <div className="save"><span>Coupon ({o.couponCode})</span><span>− {inr(o.discount)}</span></div>}
            <div><span>Delivery</span><span>{o.deliveryFee === 0 ? <b className="save">FREE</b> : inr(o.deliveryFee)}</span></div>{(o.charges || []).map((c) => <div key={c.name}><span>{c.name}</span><span>{inr(c.amount)}</span></div>)}
            <div><span>Taxes</span><span>{inr(o.tax)}</span></div><div className="tot"><b>Total · {o.payment.method === 'cod' ? 'Cash on delivery' : o.payment.status}</b><b>{inr(o.total)}</b></div></div>
          <p className="muted">{o.address.line}</p>{o.status === 'placed' && <button className="btn line block" onClick={cancel}>Cancel order</button>}</div>
      </div></div></div>);
}
