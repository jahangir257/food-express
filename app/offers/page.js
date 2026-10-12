'use client';
import Skeleton from '@/components/Skeleton';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, inr, offerText } from '@/lib/client';
import { useApp } from '@/components/Providers';
import { Icon, Empty } from '@/components/ui';
export default function Offers() {
  const { settings, toast } = useApp(), [c, setC] = useState(null);
  useEffect(() => { api('/api/coupons').then((d) => setC(d.coupons)); }, []);
  const copy = (code) => { navigator.clipboard?.writeText(code); toast(`Code ${code} copied`); };
  return (<div className="container" style={{ paddingTop: 24 }}><h1 style={{ fontSize: 32 }}>Offers & coupons</h1><p className="muted">Apply these codes at checkout.</p>
    {settings?.freeDeliveryEnabled && <div className="promo" style={{ margin: '18px 0', maxWidth: 520 }}><div className="ic"><Icon n="truck" /></div><div><b>FREE DELIVERY</b><div className="muted">Automatically applied on orders above {inr(settings.freeDeliveryAbove)}</div></div></div>}
    {!c ? <Skeleton type="list" /> : !c.length ? <Empty title="No active coupons right now" sub="Check back soon." /> :
      <div className="dgrid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}>{c.map((x) => <div key={x._id} className="card" style={{ borderStyle: 'dashed', borderColor: 'var(--p)' }}>
        <div className="row between"><b style={{ fontSize: 22, color: 'var(--p)', letterSpacing: 1 }}>{x.code}</b><button className="btn sm line" onClick={() => copy(x.code)}>Copy</button></div>
        <div style={{ margin: '6px 0' }}>{offerText(x)}</div><div className="muted">{x.description}</div>
        <div className="muted" style={{ marginTop: 8 }}>{x.scope === 'restaurant' ? <>Only at <Link href={'/restaurant/' + x.restaurant?._id} className="p">{x.restaurant?.name}</Link></> : 'All restaurants'}{x.firstOrderOnly ? ' · First order only' : ''}</div></div>)}</div>}</div>);
}
