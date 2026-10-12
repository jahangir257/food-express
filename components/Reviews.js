'use client';
import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { api, when } from '@/lib/client';
import { Veg } from './ui';

export const Stars = ({ v, size = 15 }) => <span className="stars" aria-label={`${v} out of 5`}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={size} className={n <= Math.round(v) ? 'on' : ''} />)}</span>;
export function StarInput({ value, onChange, size = 26 }) {
  return <span className="stars inp" role="radiogroup">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => onChange(value === n ? 0 : n)}><Star size={size} className={n <= value ? 'on' : ''} /></button>)}</span>;
}

// Ratings & reviews list shown in the restaurant details page
export function RestaurantReviews({ restaurantId, onLoaded }) {
  const [d, setD] = useState(null), [list, setList] = useState([]), [page, setPage] = useState(0), [busy, setBusy] = useState(false);
  const load = (p) => { setBusy(true); return api(`/api/reviews?restaurantId=${restaurantId}&page=${p}`).then((x) => { setD(x); setList((l) => (p ? [...l, ...x.reviews] : x.reviews)); setPage(p); onLoaded?.(x); }).catch(() => {}).finally(() => setBusy(false)); };
  useEffect(() => { load(0); }, [restaurantId]);
  if (!d) return null;
  return (<section id="reviews" className="msec rvs"><h2 className="mh">Ratings &amp; reviews<span>{d.count} review{d.count === 1 ? '' : 's'}</span></h2>
    {!d.count ? <div className="card muted" style={{ textAlign: 'center', padding: 24 }}>No reviews yet. Order from this restaurant and be the first to share how it was.</div> : <>
      <div className="card rv-sum"><div className="rv-avg"><b>{d.average.toFixed(1)}</b><Stars v={d.average} size={17} /><small>{d.count} ratings</small></div>
        <div className="rv-bars">{d.counts.map((n, i) => <div key={i}><span>{5 - i}★</span><i><u style={{ width: `${(n / d.count) * 100}%` }} /></i><span>{n}</span></div>)}</div></div>
      <div className="col">{list.map((r) => <div key={r._id} className="card rv">
        <div className="row between wrap"><div className="row" style={{ gap: 10 }}><span className="rv-av">{(r.customerName || 'G')[0].toUpperCase()}</span><div><b>{(r.customerName || 'Customer').split(' ')[0]}</b><div className="muted" style={{ fontSize: 12 }}>{when(r.createdAt)}</div></div></div><Stars v={r.rating} /></div>
        {r.comment && <p className="rv-c">{r.comment}</p>}
        {r.dishes?.length > 0 && <div className="rv-d">{r.dishes.map((x, i) => <span key={i}>{x.name} <b>{x.rating}★</b></span>)}</div>}
      </div>)}</div>
      {d.hasMore && <button className="btn line" style={{ marginTop: 12 }} disabled={busy} onClick={() => load(page + 1)}>{busy ? 'Loading…' : 'Show more reviews'}</button>}</>}
  </section>);
}

// Shown on a delivered order: rate the restaurant, each dish, and leave a comment
export function ReviewBox({ order, onDone }) {
  const [rating, setRating] = useState(0), [comment, setComment] = useState(''), [dish, setDish] = useState({}), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  if (order.review) return (<div className="card"><h3>Your review</h3><div style={{ margin: '8px 0' }}><Stars v={order.review.rating} size={18} /></div>{order.review.comment && <p>{order.review.comment}</p>}{order.review.dishes?.length > 0 && <div className="rv-d">{order.review.dishes.map((x, i) => <span key={i}>{x.name} <b>{x.rating}★</b></span>)}</div>}<p className="muted" style={{ marginTop: 8 }}>Thanks! Your review is shown on {order.restaurant.name}’s page.</p></div>);
  if (order.reviewed) return <div className="card muted">You’ve reviewed this order. Thank you!</div>;
  const send = async () => {
    setErr(''); setBusy(true);
    try { await api('/api/reviews', { method: 'POST', body: { orderId: order._id, rating, comment, dishes: Object.entries(dish).filter(([, v]) => v).map(([itemId, r]) => ({ itemId, rating: r })) } }); onDone?.(); } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  return (<div className="card"><h3>How was your order?</h3><p className="muted">Rate {order.restaurant.name} — your review appears on the restaurant page.</p>
    <div className="field" style={{ marginTop: 10 }}><label>Restaurant</label><StarInput value={rating} onChange={setRating} /></div>
    <div className="field"><label>Food (optional)</label>{order.items.map((i) => <div key={String(i.item)} className="row between" style={{ margin: '6px 0' }}><span className="grow ell">{i.name}</span><StarInput size={22} value={dish[i.item] || 0} onChange={(v) => setDish({ ...dish, [i.item]: v })} /></div>)}</div>
    <div className="field"><label>Your review (optional)</label><textarea rows={3} maxLength={600} placeholder="Tell others about the food and service" value={comment} onChange={(e) => setComment(e.target.value)} /></div>
    {err && <div className="err">{err}</div>}
    <button className="btn block" disabled={busy || !rating} onClick={send}>{busy ? 'Submitting…' : 'Submit review'}</button></div>);
}
