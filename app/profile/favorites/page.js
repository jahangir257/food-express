'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { useApp } from '@/components/Providers';
import { RestaurantCard } from '@/components/Cards';
import { Empty } from '@/components/ui';
import Skeleton from '@/components/Skeleton';
export default function Page() {
  const { loc, favs } = useApp(), [list, setList] = useState(null);
  useEffect(() => { api('/api/favorites' + (loc ? `?lat=${loc.lat}&lng=${loc.lng}` : '')).then((d) => setList(d.restaurants)).catch(() => setList([])); }, [loc?.lat, loc?.lng, favs.length]);
  return (<><h1 className="ptitle">Favourite restaurants</h1>
    {!list ? <Skeleton type="restaurants" /> : !list.length ? <Empty title="No favourites yet" sub="Tap the heart on any restaurant to save it here."><Link href="/" className="btn">Explore restaurants</Link></Empty> : <div className="rgrid">{list.map((r) => <RestaurantCard key={r._id} r={r} />)}</div>}</>);
}
