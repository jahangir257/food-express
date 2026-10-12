'use client';
import Skeleton from '@/components/Skeleton';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, inr, when } from '@/lib/client';
import { Img, Status, Empty } from '@/components/ui';
export default function Orders() {
  const [o, setO] = useState(null);
  useEffect(() => { api('/api/orders').then((d) => setO(d.orders)); }, []);
  return (<div className="container" style={{ maxWidth: 760, paddingTop: 24 }}><h1 style={{ fontSize: 30, marginBottom: 16 }}>Your orders</h1>
    {!o ? <Skeleton type="orders" /> : !o.length ? <Empty title="No orders yet" sub="Your orders will show up here."><Link className="btn" href="/" style={{ marginTop: 12 }}>Order now</Link></Empty> :
      <div className="col">{o.map((x) => <Link key={x._id} href={'/orders/' + x._id} className="card row"><Img src={x.restaurant?.image} style={{ width: 70, height: 70, borderRadius: 12, objectFit: 'cover', flex: 'none' }} />
        <div className="grow"><h3 style={{ fontSize: 18 }}>{x.restaurant?.name}</h3><div className="muted">{x.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</div><div className="muted">{when(x.createdAt)}</div>{x.group && <div className="muted">Combined order</div>}{x.status === 'delivered' && !x.reviewed && <div className="p" style={{ fontSize: 13, fontWeight: 700 }}>★ Rate this order</div>}</div>
        <div style={{ textAlign: 'right' }}><div>{inr(x.total)}</div><Status s={x.status} /></div></Link>)}</div>}</div>);
}
