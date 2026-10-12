'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/client';
import { useApp } from './Providers';
import { Icon, Img, Modal } from './ui';
import Slider from './Slider';
import LocationPicker from './LocationPicker';
export default function Header() {
  const path = usePathname(), router = useRouter();
  const { user, setUser, count, loc, setLoc, locOpen, setLocOpen, flushCart } = useApp();
  const [q, setQ] = useState(''), [sug, setSug] = useState(null), [showSug, setShowSug] = useState(false), [menu, setMenu] = useState(false), [cats, setCats] = useState([]);
  const sref = useRef(), mref = useRef();
  useEffect(() => { api('/api/categories').then((d) => setCats(d.categories)).catch(() => {}); }, []);
  useEffect(() => {
    if (q.trim().length < 2) return setSug(null);
    const t = setTimeout(() => api('/api/search?q=' + encodeURIComponent(q.trim())).then(setSug).catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    const h = (e) => { if (sref.current && !sref.current.contains(e.target)) setShowSug(false); if (mref.current && !mref.current.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);
  useEffect(() => { setShowSug(false); setMenu(false); }, [path]);
  const [catsOff, setCatsOff] = useState(false);
  useEffect(() => { // hide the category bar once the page is scrolled; bring it back at the top
    const h = () => setCatsOff((o) => (o ? window.scrollY > 12 : window.scrollY > 90));
    h(); window.addEventListener('scroll', h, { passive: true }); return () => window.removeEventListener('scroll', h);
  }, []);
  useEffect(() => { document.documentElement.classList.toggle('hcat-off', catsOff); return () => document.documentElement.classList.remove('hcat-off'); }, [catsOff]);
  if (['/admin', '/partner', '/rider'].some((p) => path.startsWith(p))) return null;
  const logout = async () => { await flushCart(); await fetch('/api/auth/logout', { method: 'POST' }); try { localStorage.removeItem('carts'); } catch {} setUser(null); location.href = '/'; };
  const panel = { admin: ['/admin', 'Admin dashboard'], restaurant: ['/partner', 'Restaurant dashboard'], rider: ['/rider', 'Rider app'] }[user?.role];
  const submit = (e) => { e.preventDefault(); if (q.trim()) { setShowSug(false); router.push('/search?q=' + encodeURIComponent(q.trim())); } };
  const activeCat = decodeURIComponent(path.startsWith('/category/') ? path.split('/')[2] : '');
  return (<>
    <header className="hdr">
      <div className="container hdr-top">
        <Link href="/" className="logo">foodie<b>express</b></Link>
        <button className="locbtn" onClick={() => setLocOpen(true)}><Icon n="pin" s={20} /><span><small>DELIVER TO</small><span className="t">{loc?.label || 'Select location'}</span></span><Icon n="chev" s={14} /></button>
        <div className="hsearch" ref={sref}><Icon n="search" s={18} />
          <form onSubmit={submit}><input placeholder="Search for restaurants, cuisines or dishes" value={q} onFocus={() => setShowSug(true)} onChange={(e) => { setQ(e.target.value); setShowSug(true); }} /></form>
          {showSug && sug && (sug.restaurants.length > 0 || sug.dishes.length > 0) && <div className="sug">
            {sug.restaurants.length > 0 && <h6>Restaurants</h6>}{sug.restaurants.map((r) => <Link key={r._id} href={'/restaurant/' + r._id}><Img src={r.image} /><div><div>{r.name}</div><div className="muted">{(r.cuisines || []).join(', ')}</div></div></Link>)}
            {sug.dishes.length > 0 && <h6>Dishes</h6>}{sug.dishes.map((d) => <Link key={d._id} href={`/restaurant/${d.restaurant?._id}?dish=${d._id}`}><div className="imgfb">🍽️</div><div><div>{d.name}</div><div className="muted">{d.restaurant?.name} · ₹{d.price}</div></div></Link>)}
            <Link href={'/search?q=' + encodeURIComponent(q)} style={{ justifyContent: 'center', color: 'var(--p)' }}>See all results for “{q}”</Link></div>}
        </div>
        <div className="hlinks">
          <Link href="/offers" className="hl"><Icon n="tag" /><span className="lb">Offers</span></Link>
          {(!user || user.role === 'customer') && <Link href="/cart" className="hl"><span className="cico"><Icon n="cart" />{count > 0 && <span className="cartct">{count > 99 ? '99+' : count}</span>}</span><span className="lb">Cart</span></Link>}
          {user ? <div className="menu" ref={mref}><button className="hl" onClick={() => setMenu(!menu)}><span className="av">{user.name[0]?.toUpperCase()}</span><span className="lb">{user.name.split(' ')[0]}</span><Icon n="chev" s={14} /></button>
            {menu && <div className="drop"><div className="who"><b>{user.name}</b><div className="muted">{user.email}</div></div>
              {user.role === 'customer' && <><Link href="/orders"><Icon n="bag" s={18} />My orders</Link><Link href="/profile/favorites"><Icon n="heart" s={18} />Favourites</Link><Link href="/profile/addresses"><Icon n="pin" s={18} />Saved addresses</Link></>}<Link href={user.role === 'customer' ? '/profile' : user.role === 'admin' ? '/admin/profile' : user.role === 'restaurant' ? '/partner/account' : '/rider/profile'}><Icon n="profile" s={18} />My profile</Link>{panel && <Link href={panel[0]}><Icon n="chart" s={18} />{panel[1]}</Link>}
              <button onClick={logout}><Icon n="logout" s={18} />Logout</button></div>}</div>
            : <><Link href="/login" className="hl"><Icon n="user" /><span className="lb">Log in</span></Link><Link href="/register" className="btn sm">Sign up</Link></>}
        </div>
      </div>
      {cats.length > 0 && <div className={'container hdr-catw' + (catsOff ? ' off' : '')}><Slider className="hdr-cats" deps={[cats.length]}><Link href="/" className={path === '/' ? 'on' : ''}><span className="ci">🍴</span>All</Link>{cats.map((c) => <Link key={c._id} href={'/category/' + encodeURIComponent(c.name)} className={activeCat === c.name ? 'on' : ''}><span className="ci">{c.emoji || '🍽️'}</span>{c.name}</Link>)}</Slider></div>}
    </header>
    <Modal open={locOpen} onClose={() => setLocOpen(false)} title="Choose delivery location"><LocationPicker onPick={setLoc} /></Modal>
  </>);
}
