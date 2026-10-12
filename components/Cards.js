'use client';
import FavButton from './FavButton';
import Link from 'next/link';
import { inr } from '@/lib/client';
import { useApp } from './Providers';
import { Icon, Img, Rating, Veg, Stepper } from './ui';
export function RestaurantCard({ r }) {
  return (<Link href={`/restaurant/${r._id}`} className={'rc' + (r.serviceable ? '' : ' off')}>
    <div className="im"><Img src={r.image} alt={r.name} />{r.offer && <div className="ofr">{r.offer}</div>}<FavButton id={r._id} className="fav-card" />{r.logo && <img src={r.logo} alt="" className="rlogo" />}</div>
    <h3>{r.name}</h3>
    <div className="meta"><Rating v={r.rating} /><span>•</span><span>{r.prepMinutes}-{r.prepMinutes + 5} mins</span>{r.distanceKm !== undefined && <><span>•</span><span>{r.distanceKm} km</span></>}</div>
    <div className="muted ell">{(r.cuisines || []).join(', ')}</div>
    {!r.isOpen ? <span className="pill">Closed now</span> : !r.serviceable && <span className="pill">Doesn’t deliver to your location</span>}
  </Link>);
}
export function DishCard({ p }) {
  const { add, change, qtyOf } = useApp(), q = qtyOf(p.restaurant._id, p._id), href = `/restaurant/${p.restaurant._id}?dish=${p._id}`;
  return (<div className="dc">
    <Link href={href} className="dci"><Img src={p.image} alt={p.name} />{p.ordered >= 150 && <span className="tag">Bestseller</span>}</Link>
    <div className="dcb"><div className="row between"><span><Veg veg={p.veg} /></span><Rating v={p.restaurant.rating} /></div>
      <Link href={href}><h4>{p.name}</h4></Link>
      <div className="muted ell">{p.restaurant.name}{p.restaurant.distanceKm !== undefined ? ` · ${p.restaurant.distanceKm} km` : ''}</div>
      {p.ordered > 0 && <div className="muted">{p.ordered}+ ordered</div>}
      <div className="row between foot"><b>{inr(p.price)}</b>
        {q ? <Stepper q={q} onMinus={() => change(p.restaurant._id, p._id, -1)} onPlus={() => change(p.restaurant._id, p._id, 1)} />
          : <button className="btn sm line addbtn" onClick={() => add(p.restaurant, p)}>ADD</button>}</div></div></div>);
}
export const Section = ({ id, title, sub, children, right }) => <section id={id} style={{ scrollMarginTop: 'var(--hh)' }}><div className="sec"><div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>{right}</div>{children}</section>;
