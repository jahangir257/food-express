'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { useApp } from '@/components/Providers';
import { Empty } from '@/components/ui';
import { RestaurantCard, DishCard, Section } from '@/components/Cards';
export default function Search() {
  const { loc } = useApp(), [q, setQ] = useState(null), [rs, setRs] = useState(null), [ps, setPs] = useState(null);
  useEffect(() => { setQ(new URLSearchParams(location.search).get('q') || ''); const on = () => setQ(new URLSearchParams(location.search).get('q') || ''); window.addEventListener('popstate', on); return () => window.removeEventListener('popstate', on); }, []);
  useEffect(() => {
    if (q === null) return; setRs(null); setPs(null);
    const g = loc ? `&lat=${loc.lat}&lng=${loc.lng}` : '';
    api(`/api/restaurants?q=${encodeURIComponent(q)}${g}`).then((d) => setRs(d.restaurants)).catch(() => setRs([]));
    api(`/api/products?q=${encodeURIComponent(q)}&limit=16${g}`).then((d) => setPs(d.products)).catch(() => setPs([]));
  }, [q, loc]);
  return (<div className="container" style={{ paddingTop: 24 }}><h1 style={{ fontSize: 30 }}>Results for “{q}”</h1>
    <Section title="Dishes">{!ps ? <p className="muted">Searching…</p> : !ps.length ? <p className="muted">No dishes found.</p> : <div className="dgrid">{ps.map((p) => <DishCard key={p._id} p={p} />)}</div>}</Section>
    <Section title="Restaurants">{!rs ? <p className="muted">Searching…</p> : !rs.length ? <Empty title="No restaurants found" sub="Try a different search." /> : <div className="rgrid">{rs.map((r) => <RestaurantCard key={r._id} r={r} />)}</div>}</Section></div>);
}
