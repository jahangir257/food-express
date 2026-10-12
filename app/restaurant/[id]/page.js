'use client';
import Skeleton from '@/components/Skeleton';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api, inr, offerText } from '@/lib/client';
import { useApp } from '@/components/Providers';
import { Icon, Img, Veg, Stepper } from '@/components/ui';
import Chat from '@/components/Chat';
import FavButton from '@/components/FavButton';
import { RestaurantReviews } from '@/components/Reviews';
export default function RestaurantPage({ params }) {
  const { add, change, qtyOf, carts, settings, loc, setLocOpen, ask } = useApp();
  const [d, setD] = useState(null), [err, setErr] = useState(''), [q, setQ] = useState(''), [diet, setDiet] = useState('all'), [hl, setHl] = useState(''), [active, setActive] = useState(0);
  useEffect(() => { api('/api/restaurants/' + params.id + (loc ? `?lat=${loc.lat}&lng=${loc.lng}` : '')).then(setD).catch((e) => setErr(e.message)); }, [params.id, loc?.lat, loc?.lng]);
  useEffect(() => {
    if (!d) return; const id = new URLSearchParams(location.search).get('dish'); if (!id) return;
    setHl(id); setTimeout(() => document.getElementById('i-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
  }, [d]);
  const cart = carts.find((c) => c.restaurant._id === params.id), cartIdx = carts.findIndex((c) => c.restaurant._id === params.id);
  const sub = cart ? cart.items.reduce((s, i) => s + i.price * i.qty, 0) : 0, n = cart ? cart.items.reduce((s, i) => s + i.qty, 0) : 0;
  const all = d?.menu || [], vegN = all.filter((m) => m.veg).length, nonN = all.length - vegN;
  const menu = useMemo(() => all.filter((m) => (diet === 'all' || (diet === 'veg' ? m.veg : !m.veg)) && m.name.toLowerCase().includes(q.toLowerCase())), [d, q, diet]);
  const cats = useMemo(() => [...new Set(menu.map((m) => m.category))], [menu]);
  const catKey = cats.join('|');
  useEffect(() => { // highlight the category currently in view
    if (!cats.length) return;
    const obs = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting) setActive(Number(e.target.dataset.i)); }); }, { rootMargin: '-170px 0px -65% 0px' });
    cats.forEach((_, i) => { const el = document.getElementById('c-' + i); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [catKey]);
  useEffect(() => { document.getElementById('rc-' + active)?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }, [active]);
  const go = (i) => { setActive(i); document.getElementById('c-' + i)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  if (err) return <div className="container"><p className="err" style={{ padding: 30 }}>{err}</p></div>;
  if (!d) return <Skeleton type="restaurant" />;
  const r = d.restaurant, free = settings?.freeDeliveryEnabled ? settings.freeDeliveryAbove : null;
  const extra = (r.charges || []).filter((c) => c.amount > 0);
  const showSeg = vegN > 0 && nonN > 0, out = d.distanceKm != null && d.serviceable === false, canAdd = r.isOpen && !out;
  const search = <div className="rsearch"><Icon n="search" s={18} /><input placeholder="Search in menu" value={q} onChange={(e) => setQ(e.target.value)} />{q && <button className="rclr" aria-label="Clear search" onClick={() => setQ('')}><Icon n="x" s={15} /></button>}</div>;
  const seg = showSeg && <div className="seg" role="group" aria-label="Diet filter"><button className={diet === 'all' ? 'on' : ''} onClick={() => setDiet('all')}>All <small>{all.length}</small></button>
    <button className={'sv' + (diet === 'veg' ? ' on' : '')} onClick={() => setDiet('veg')}><Veg veg /> Veg <small>{vegN}</small></button>
    <button className={'sx' + (diet === 'non' ? ' on' : '')} onClick={() => setDiet('non')}><Veg veg={false} /> Non-veg <small>{nonN}</small></button></div>;
  const offers = [...(r.offer ? [{ code: r.offer, text: 'Restaurant offer' }] : []), ...d.coupons.map((c) => ({ code: c.code, text: offerText(c) }))].slice(0, 4);
  return (<div className="rpage">
    <section className="rh3"><div className="container rh3g">
      <div className="rph">{r.image ? <img src={r.image} alt={r.name} onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <div className="rnophoto"><Icon n="food" s={42} /></div>}
        <span className={'ropen ' + (r.isOpen ? 'on' : 'off')}><i />{r.isOpen ? 'Open now' : 'Closed now'}</span>
        <div className="rlogo2">{r.logo ? <img src={r.logo} alt={r.name + ' logo'} /> : <span>{r.name?.[0]?.toUpperCase()}</span>}</div></div>
      <div className="rdet2">
        <div className="rhead"><div className="grow"><div className="crumb"><Link href="/">Home</Link> / {r.name}</div><h1>{r.name}{r.pureVeg && <span className="rpv2"><Veg veg /> Pure veg</span>}</h1></div><FavButton id={r._id} className="fav-lg" label /></div>
        <div className="rcus">{(r.cuisines || []).map((c) => <span key={c}>{c}</span>)}</div>
        <div className="raddr"><Icon n="pin" s={15} /><span className="ell">{String(r.address || '').split(',').slice(0, 2).join(',').trim()}</span>
          {d.distanceKm != null ? <span className={'dp ' + (d.serviceable ? 'ok' : 'bad')} title={d.serviceable ? '' : `Outside ${r.deliveryRadiusKm} km delivery range`}><Icon n="bike" s={14} />{d.serviceable ? `${d.distanceKm} km away` : `${d.distanceKm} km · out of range`}</span>
            : <button className="dp setloc" onClick={() => setLocOpen(true)}><Icon n="pin" s={14} />Set location</button>}</div>
        <div className="rchips"><span style={{ cursor: 'pointer' }} onClick={() => { document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' }); }}><Icon n="star" s={15} /><b>{Number(r.rating).toFixed(1)}</b>{r.ratingCount > 0 && <small> ({r.ratingCount})</small>}</span><span><Icon n="clock" s={15} />{r.prepMinutes}-{r.prepMinutes + 5} min</span><span><Icon n="bike" s={15} />Up to {r.deliveryRadiusKm} km</span>{free && <span><Icon n="truck" s={15} />Free above {inr(free)}</span>}</div>
        {out && <div className="rout"><Icon n="pin" s={15} />This restaurant is {d.distanceKm} km away — outside its {r.deliveryRadiusKm} km delivery range. <button className="lnk" onClick={() => setLocOpen(true)}>Change location</button></div>}
        {offers.length > 0 && <div className="roff">{offers.map((o) => <span key={o.code}><Icon n="tag" s={14} /><b>{o.code}</b> {o.text}</span>)}</div>}
        {extra.length > 0 && <div className="muted" style={{ fontSize: 12.5 }}>Extra charges: {extra.map((c) => `${c.name} ${inr(c.amount)}`).join(' · ')}</div>}
      </div></div></section>
    <div className="rtool"><div className="container"><div className="rt-row">{search}{seg}</div>
      {cats.length > 1 && <div className="rcats">{cats.map((c, i) => <button id={'rc-' + i} key={c} className={'rcat' + (active === i ? ' on' : '')} onClick={() => go(i)}>{c}</button>)}</div>}</div></div>
    <div className="container">
      <div className="rlay">
        <nav className="mnav"><div className="mnh">Menu</div>{search}{seg}<div className="mnl">{cats.map((c, i) => <button key={c} className={active === i ? 'on' : ''} onClick={() => go(i)}><span className="mt">{c}</span><span className="mcnt">{menu.filter((m) => m.category === c).length}</span></button>)}</div></nav>
        <div>{!menu.length && <div className="card muted" style={{ textAlign: 'center', padding: 30 }}>No dishes found{diet !== 'all' ? ` in ${diet === 'veg' ? 'Veg' : 'Non-veg'}` : ''}. <button className="btn line sm" style={{ marginLeft: 8 }} onClick={() => { setQ(''); setDiet('all'); }}>Clear filters</button></div>}
          {cats.map((c, i) => <section key={c} id={'c-' + i} data-i={i} className="msec"><h2 className="mh">{c}<span>{menu.filter((m) => m.category === c).length} items</span></h2>
            <div className="mgrid">{menu.filter((m) => m.category === c).map((m) => { const qty = qtyOf(r._id, m._id); return (
              <div key={m._id} id={'i-' + m._id} className={'mcard' + (hl === m._id ? ' hl' : '')}>
                {m.image ? <Img src={m.image} alt={m.name} className="mimg" /> : <div className="mimg mnoimg"><Icon n="food" s={26} /></div>}
                <div className="mb"><div className="mn"><Veg veg={m.veg} /><h4>{m.name}</h4></div>{m.ratings > 0 && <span className="mrate"><Icon n="star" s={12} />{m.rating} <small style={{ fontWeight: 400 }}>({m.ratings})</small></span>}{m.description && <p className="mdesc">{m.description}</p>}
                  <div className="mf"><span className="mprice">{inr(m.price)}</span>{qty ? <Stepper q={qty} onMinus={() => change(r._id, m._id, -1)} onPlus={() => change(r._id, m._id, 1)} /> : <button className="btn sm line addbtn" disabled={!canAdd} onClick={() => canAdd && add(r, m)} title={out ? 'Outside delivery range' : ''}>{!r.isOpen ? 'Closed' : out ? 'Out of range' : 'ADD'}</button>}</div></div></div>); })}</div></section>)}
          <RestaurantReviews restaurantId={r._id} /></div>
        <aside className="card rcart"><div className="hd"><h3>{cart ? `Cart ${cartIdx + 1}` : 'Your cart'}</h3><div className="muted">{cart ? `from ${r.name}` : 'Add dishes to get started'}</div></div>
          {cart ? <><div className="bd">{cart.items.map((i) => <div key={i._id} className="row between" style={{ margin: '10px 0' }}><span className="grow"><Veg veg={i.veg} />{i.name}</span><Stepper q={i.qty} onMinus={() => (i.qty > 1 ? change(r._id, i._id, -1) : ask({ title: 'Remove this item?', message: `${i.name} will be removed from your cart.`, confirmText: 'Remove' }).then((y) => y && change(r._id, i._id, -1)))} onPlus={() => change(r._id, i._id, 1)} /><span style={{ width: 62, textAlign: 'right' }}>{inr(i.price * i.qty)}</span></div>)}</div>
            <div className="ft"><div className="row between"><b>Subtotal</b><b>{inr(sub)}</b></div>
              {free ? (sub >= free ? <div className="pill ok" style={{ marginTop: 8 }}>You’ve unlocked free delivery</div> : <><div className="muted" style={{ marginTop: 8 }}>Add {inr(free - sub)} more for free delivery</div><div className="bar"><i style={{ width: `${Math.min(100, (sub / free) * 100)}%` }} /></div></>) : null}
              <Link href={'/cart?r=' + r._id} className="btn block" style={{ marginTop: 10 }}>Checkout</Link>
              {carts.length > 1 && <div className="muted" style={{ marginTop: 8 }}>You have {carts.length - 1} other cart{carts.length > 2 ? 's' : ''} from different restaurants.</div>}</div></>
            : <div className="bd muted" style={{ padding: '30px 18px', textAlign: 'center' }}>Your cart is empty.</div>}</aside>
      </div></div>
    {cart && <div className="cartbar"><div className="container"><span>{n} item{n > 1 ? 's' : ''} | {inr(sub)}</span><Link href={'/cart?r=' + r._id} className="row" style={{ gap: 6 }}>View cart <Icon n="cart" s={18} /></Link></div></div>}
    <Chat /></div>);
}
