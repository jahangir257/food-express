'use client';
import Skeleton from '@/components/Skeleton';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { useApp } from '@/components/Providers';
import { Icon, Img, Empty } from '@/components/ui';
import { RestaurantCard, DishCard, Section } from '@/components/Cards';
import Slider from '@/components/Slider';
import Chat from '@/components/Chat';
export default function Category({ params }) {
  const name = decodeURIComponent(params.name), { loc, setLocOpen } = useApp();
  const [cats, setCats] = useState([]), [pop, setPop] = useState(null), [top, setTop] = useState(null), [rs, setRs] = useState(null);
  useEffect(() => { api('/api/categories').then((d) => setCats(d.categories)); }, []);
  useEffect(() => {
    setPop(null); setTop(null); setRs(null);
    const g = loc ? `&lat=${loc.lat}&lng=${loc.lng}` : '', c = `category=${encodeURIComponent(name)}`;
    api(`/api/products?${c}&sort=popular&limit=8${g}`).then((d) => setPop(d.products)).catch(() => setPop([]));
    api(`/api/products?${c}&sort=rating&limit=8${g}`).then((d) => setTop(d.products)).catch(() => setTop([]));
    api(`/api/restaurants?q=${encodeURIComponent(name)}&sort=rating${g}`).then((d) => setRs(d.restaurants)).catch(() => setRs([]));
  }, [name, loc]);
  const cur = cats.find((c) => c.name === name);
  return (<div className="container" style={{ paddingTop: 18 }}>
    <div className="chead"><Img src={cur?.image} emoji={cur?.emoji || '🍽️'} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flex: 'none' }} /><div className="grow"><h1>{name}</h1>
      <div className="cloc"><Icon n="pin" s={15} />{loc ? <><span className="ell">Delivering to <b>{String(loc.label || 'your location').split(',').slice(0, 2).join(',')}</b></span><button className="lnk" onClick={() => setLocOpen(true)}>Change</button></> : <><span>Set a location to see what delivers to you</span><button className="lnk" onClick={() => setLocOpen(true)}>Set location</button></>}</div></div></div>
    <Slider className="cats" deps={[cats.length]}>{cats.map((c) => <Link key={c._id} href={'/category/' + encodeURIComponent(c.name)} className={'cat' + (c.name === name ? ' on' : '')}><Img src={c.image} alt={c.name} emoji={c.emoji || '🍽️'} /><div className="t">{c.name}</div></Link>)}</Slider>
    <Section title={`Highly ordered in ${name}`} sub="Dishes people keep coming back for">{!pop ? <Skeleton type="dishes" /> : !pop.length ? <Empty title="No dishes yet" sub="No restaurants near you serve this right now." /> : <div className="dgrid">{pop.map((p) => <DishCard key={p._id} p={p} />)}</div>}</Section>
    <Section title="Top rated" sub="From the best-rated kitchens">{!top ? <Skeleton type="dishes" /> : !top.length ? <Empty title="No top rated dishes yet" sub="Dishes will show here once they get rated." /> : <div className="dgrid">{top.map((p) => <DishCard key={p._id} p={p} />)}</div>}</Section>
    <Section title={`${name} restaurants near you`}>{!rs ? <Skeleton type="restaurants" /> : !rs.length ? <Empty title="No restaurants found" sub="Try another location or category." /> : <div className="rgrid">{rs.map((r) => <RestaurantCard key={r._id} r={r} />)}</div>}</Section>
    <Chat /></div>);
}
