'use client';
import Skeleton from '@/components/Skeleton';
import Select from '@/components/Select';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, inr, offerText } from '@/lib/client';
import { useApp } from '@/components/Providers';
import { Icon, Img, Empty } from '@/components/ui';
import { RestaurantCard, DishCard, Section } from '@/components/Cards';
import Slider from '@/components/Slider';
import Chat from '@/components/Chat';
export default function Home() {
  const { loc, setLocOpen, ready, settings } = useApp();
  const [cats, setCats] = useState([]), [catsDone, setCatsDone] = useState(false), [list, setList] = useState(null), [prods, setProds] = useState(null), [top, setTop] = useState(null), [tick, setTick] = useState(0);
  const [f, setF] = useState({ veg: false, rating: false, offers: false, sort: 'relevance' });
  useEffect(() => { api('/api/categories').then((d) => setCats(d.categories)).catch(() => {}).finally(() => setCatsDone(true)); }, []);
  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 3200); return () => clearInterval(t); }, []);
  useEffect(() => { if (ready && !loc && !localStorage.getItem('loc')) setLocOpen(true); }, [ready]);
  useEffect(() => {
    setProds(null); const p = new URLSearchParams({ diverse: 1, limit: 8, sort: 'popular' }); if (loc) { p.set('lat', loc.lat); p.set('lng', loc.lng); }
    api('/api/products?' + p).then((d) => setProds(d.products)).catch(() => setProds([]));
    setTop(null); const q = new URLSearchParams({ diverse: 1, limit: 10, sort: 'rating' }); if (loc) { q.set('lat', loc.lat); q.set('lng', loc.lng); }
    api('/api/products?' + q).then((d) => setTop(d.products)).catch(() => setTop([]));
  }, [loc]);
  useEffect(() => {
    setList(null); const p = new URLSearchParams({ sort: f.sort }); if (loc) { p.set('lat', loc.lat); p.set('lng', loc.lng); }
    if (f.veg) p.set('veg', 1); if (f.rating) p.set('rating', 1); if (f.offers) p.set('offers', 1);
    api('/api/restaurants?' + p).then((d) => setList(d.restaurants)).catch(() => setList([]));
  }, [loc, f]);
  const chip = (k, label) => <button key={k} className={'chip' + (f[k] ? ' on' : '')} onClick={() => setF({ ...f, [k]: !f[k] })}>{label}</button>;
  return (<>
    <section className="hero"><div className="container hero2">
      <div className="hcopy"><span className="hbadge"><Icon n="flame" s={15} />Hot & fresh, every time</span>
        <h1>Order food you love, <span>delivered to your door</span></h1><p>Discover popular dishes and top restaurants near you — fast, fresh and always on time.</p>
        <div className="hcta">{!loc && <button className="btn" onClick={() => setLocOpen(true)}><Icon n="pin" s={17} />Set delivery location</button>}<a href="#top-dishes" className="btn line"><Icon n="food" s={17} />Explore top dishes</a></div></div>
      <div className="collage" aria-hidden="true">
        {['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=700&q=70', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=70', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=70'].map((u, i) => <div key={u} className={'cp pos' + ((i + tick) % 3)}><Img src={u} /></div>)}
        <div className="fb f1"><Icon n="bike" s={18} /><div><b>30 min</b><span>avg. delivery</span></div></div>
        <div className="fb f2"><Icon n="star" s={16} /><div><b>4.8</b><span>top rated</span></div></div>
      </div></div></section>
    <div className="container">
      {catsDone && cats.length === 0 && <Section title="What’s on your mind?"><Empty title="No categories yet" sub="Food categories will appear here soon." /></Section>}
      {cats.length > 0 && <Section title="What’s on your mind?"><Slider className="cats" deps={[cats.length]}>{cats.map((c) => (
        <Link key={c._id} href={'/category/' + encodeURIComponent(c.name)} className="cat"><Img src={c.image} alt={c.name} emoji={c.emoji || '🍽️'} /><div className="t">{c.name}</div></Link>))}</Slider></Section>}
      <Section id="top-dishes" title="Top dishes for you" sub="Highest-rated dishes you will love">{!top ? <Skeleton type="dishes" /> : !top.length ? <Empty title="No dishes to show yet" sub="Try selecting a different location." /> : <div className="dgrid slide">{top.map((p) => <DishCard key={p._id} p={p} />)}</div>}</Section>
      <Section title="Recommended for you" sub={loc ? 'Popular dishes from restaurants that deliver to you' : 'Popular dishes right now'}>
        {!prods ? <Skeleton type="dishes" /> : !prods.length ? <Empty title="No dishes to show yet" sub="Try selecting a different location." /> : <div className="dgrid slide">{prods.map((p) => <DishCard key={p._id} p={p} />)}</div>}</Section>
      <Section title={loc ? 'Restaurants near you' : 'Top restaurants'}>
        <div className="chips">{chip('veg', 'Pure veg')}{chip('rating', 'Rating 4.0+')}{chip('offers', 'Has offers')}
          <Select className="pillsel" value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value })}><option value="relevance">Relevance</option><option value="rating">Rating</option><option value="time">Delivery time</option>{loc && <option value="distance">Distance</option>}</Select></div>
        {!list ? <Skeleton type="restaurants" /> : !list.length ? <Empty title="No restaurants found" sub="Nothing matches here yet. Try another location or clear filters." /> : <div className="rgrid">{list.map((r) => <RestaurantCard key={r._id} r={r} />)}</div>}</Section>
    </div><Chat /></>);
}
