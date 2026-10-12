'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Trash2, X } from 'lucide-react';
import { inr } from '@/lib/client';
const MAX_CARTS = 5;
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
export default function Providers({ children }) {
  const [user, setUser] = useState(null), [ready, setReady] = useState(false), [locOpen, setLocOpen] = useState(false);
  const [carts, setCarts] = useState([]), [loaded, setLoaded] = useState(false), [loc, setLocS] = useState(null), [toastMsg, setToast] = useState(''), [settings, setSettings] = useState(null), [favs, setFavs] = useState([]), [addresses, setAddresses] = useState([]);
  const tt = useRef(), cartsRef = useRef([]), saveT = useRef(), pending = useRef(false), mode = useRef('pending'), [cartLoaded, setCartLoaded] = useState(false), [cfm, setCfm] = useState(null), [repl, setRepl] = useState(null);
  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setUser(d.user)).finally(() => setReady(true));
    fetch('/api/public-settings').then((r) => r.json()).then(setSettings).catch(() => {});
    try { const c = JSON.parse(localStorage.getItem('carts')) || []; cartsRef.current = c; setCarts(c); } catch {}
    try { setLocS(JSON.parse(localStorage.getItem('loc'))); } catch {}
    setLoaded(true);
  }, []);
  // ---- cart storage: guests -> localStorage, logged-in customers -> database ----
  const putCart = () => { pending.current = false; if (mode.current !== 'user') return Promise.resolve(); return fetch('/api/cart', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ carts: cartsRef.current }), keepalive: true }).catch(() => {}); };
  const saveCart = (now) => {
    if (mode.current === 'guest') { try { localStorage.setItem('carts', JSON.stringify(cartsRef.current)); } catch {} return; }
    if (mode.current !== 'user') return;
    clearTimeout(saveT.current); pending.current = true;
    if (now) putCart(); else saveT.current = setTimeout(putCart, 500);
  };
  const commit = (next, now) => { cartsRef.current = next; setCarts(next); saveCart(now); };
  const flushCart = async () => { clearTimeout(saveT.current); if (pending.current) await putCart(); };
  useEffect(() => { // don't lose a pending save when the tab closes / navigates away
    const h = () => { if (pending.current) { clearTimeout(saveT.current); putCart(); } };
    window.addEventListener('pagehide', h); document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && h());
    return () => window.removeEventListener('pagehide', h);
  }, []);
  useEffect(() => { // decide where the cart lives once we know who the visitor is
    if (!ready) return;
    if (user && user.role === 'customer') {
      let guest = []; try { guest = JSON.parse(localStorage.getItem('carts')) || []; } catch {}
      (guest.length ? fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ carts: guest }) }) : fetch('/api/cart')).then((r) => r.json())
        .then((d) => { if (!d.carts) return; localStorage.removeItem('carts'); cartsRef.current = d.carts; setCarts(d.carts); if (guest.length && d.carts.length) toast('Your cart items were added to your account'); })
        .catch(() => {}).finally(() => { mode.current = 'user'; setCartLoaded(true); });
    } else if (user) { localStorage.removeItem('carts'); cartsRef.current = []; setCarts([]); mode.current = 'none'; setCartLoaded(true); }
    else { // guest: if we just came from a logged-in session (logout) wipe the cart everywhere; otherwise keep the guest's own cart
      const wasUser = mode.current === 'user' || mode.current === 'none';
      mode.current = 'guest';
      if (wasUser) { clearTimeout(saveT.current); pending.current = false; cartsRef.current = []; setCarts([]); try { localStorage.removeItem('carts'); } catch {} }
      setCartLoaded(true);
    }
  }, [ready, user?.id]);
  const setLoc = (l) => { setLocS(l); localStorage.setItem('loc', JSON.stringify(l)); setLocOpen(false); };
  const loadAddresses = () => fetch('/api/addresses').then((r) => (r.ok ? r.json() : { addresses: [] })).then((d) => { setAddresses(d.addresses || []); return d.addresses || []; }).catch(() => []);
  // favourites + saved addresses live in the database; load them after login and apply the default address once per session
  useEffect(() => {
    if (!user) { setFavs([]); setAddresses([]); return; }
    fetch('/api/favorites?ids=1').then((r) => r.json()).then((d) => setFavs(d.ids || [])).catch(() => {});
    loadAddresses().then((list) => {
      const def = list.find((a) => a.isDefault), key = 'addrApplied:' + user.id;
      if (def && !sessionStorage.getItem(key) && !localStorage.getItem('loc')) { sessionStorage.setItem(key, '1'); setLoc({ lat: def.lat, lng: def.lng, label: def.area, addressId: def._id }); }
    });
  }, [user?.id]);
  const toggleFav = async (rid) => {
    if (!user) { location.href = '/login?next=' + encodeURIComponent(location.pathname); return; }
    const was = favs.includes(rid); setFavs((f) => (was ? f.filter((x) => x !== rid) : [...f, rid]));
    try {
      const r = await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restaurantId: rid, favorite: !was }) }), d = await r.json();
      if (!r.ok) throw new Error(); setFavs(d.ids); toast(!was ? 'Added to favourites' : 'Removed from favourites');
    } catch { setFavs((f) => (was ? [...f, rid] : f.filter((x) => x !== rid))); toast('Could not update favourites'); }
  };
  const toast = (m) => { setToast(m); clearTimeout(tt.current); tt.current = setTimeout(() => setToast(''), 2400); };
  // Each restaurant gets its own cart (Cart 1, Cart 2, …) — nothing is ever replaced
  const add = (restaurant, item) => {
    const cs = cartsRef.current, idx = cs.findIndex((c) => c.restaurant._id === restaurant._id);
    const it = { _id: item._id, name: item.name, price: item.price, veg: item.veg, image: item.image, qty: 1 };
    if (idx < 0 && cs.length >= MAX_CARTS) { setRepl({ restaurant, item }); return; } // 5 carts max: ask which one to replace
    commit(idx < 0 ? [...cs, { restaurant: { _id: restaurant._id, name: restaurant.name, image: restaurant.image }, items: [it] }]
      : cs.map((c, k) => k !== idx ? c : { ...c, items: c.items.some((x) => x._id === item._id) ? c.items.map((x) => x._id === item._id ? { ...x, qty: x.qty + 1 } : x) : [...c.items, it] }));
    toast(`${item.name} added to Cart ${idx < 0 ? cs.length + 1 : idx + 1} · ${restaurant.name}`);
  };
  const replaceCart = (rid) => {
    if (!repl) return; const { restaurant, item } = repl, cs = cartsRef.current, i = cs.findIndex((c) => c.restaurant._id === rid); if (i < 0) return setRepl(null);
    const nc = { restaurant: { _id: restaurant._id, name: restaurant.name, image: restaurant.image }, items: [{ _id: item._id, name: item.name, price: item.price, veg: item.veg, image: item.image, qty: 1 }] };
    commit(cs.map((c, k) => (k === i ? nc : c)), true); setRepl(null); toast(`${item.name} added · Cart ${i + 1} is now ${restaurant.name}`);
  };
  useEffect(() => { if (!repl) return; const k = (e) => e.key === 'Escape' && setRepl(null); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [repl]);
  const change = (rid, itemId, d) => commit(cartsRef.current.map((c) => c.restaurant._id !== rid ? c : { ...c, items: c.items.map((x) => x._id === itemId ? { ...x, qty: x.qty + d } : x).filter((x) => x.qty > 0) }).filter((c) => c.items.length), cartsRef.current.some((c) => c.restaurant._id === rid && c.items.some((x) => x._id === itemId && x.qty + d <= 0)));
  const removeCart = (rid) => commit(cartsRef.current.filter((c) => c.restaurant._id !== rid), true);
  const qtyOf = (rid, itemId) => carts.find((c) => c.restaurant._id === rid)?.items.find((x) => x._id === itemId)?.qty || 0;
  // themed confirmation popup: const ok = await ask({ title, message, confirmText, cancelText, tone: 'danger' | 'warn' | 'primary' })
  const ask = (o) => new Promise((res) => setCfm({ tone: 'danger', confirmText: 'Delete', cancelText: 'Cancel', ...o, res }));
  const closeCfm = (v) => { cfm?.res(v); setCfm(null); };
  useEffect(() => { if (!cfm) return; const k = (e) => e.key === 'Escape' && closeCfm(false); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [cfm]);
  const CI = cfm ? { danger: Trash2, warn: AlertTriangle, primary: CheckCircle2 }[cfm.tone] || Trash2 : null;
  const count = carts.reduce((s, c) => s + c.items.reduce((a, i) => a + i.qty, 0), 0);
  return <Ctx.Provider value={{ user, setUser, ready, carts, add, change, removeCart, qtyOf, count, loc, setLoc, locOpen, setLocOpen, toast, settings, favs, toggleFav, addresses, setAddresses, loadAddresses, ask, flushCart, cartLoaded }}>{children}
    {cfm && <div className="ovl cfm-ovl" onMouseDown={(e) => e.target === e.currentTarget && closeCfm(false)}><div className={'modal cfm ' + cfm.tone} role="alertdialog" aria-modal="true" aria-labelledby="cfm-t"><div className="cfm-ic"><CI size={26} /></div><h3 id="cfm-t">{cfm.title}</h3>{cfm.message && <p>{cfm.message}</p>}<div className="cfm-act"><button className="btn line" autoFocus onClick={() => closeCfm(false)}>{cfm.cancelText}</button><button className={'btn ' + (cfm.tone === 'primary' ? '' : 'dngbtn')} onClick={() => closeCfm(true)}>{cfm.confirmText}</button></div></div></div>}{repl && <div className="ovl cfm-ovl" onMouseDown={(e) => e.target === e.currentTarget && setRepl(null)}><div className="modal rpl" role="dialog" aria-modal="true" aria-labelledby="rpl-t">
      <div className="rpl-h"><div className="cfm-ic warn"><AlertTriangle size={24} /></div><div className="grow"><h3 id="rpl-t">You can have up to {MAX_CARTS} carts</h3><p>To add <b>{repl.item.name}</b> from <b>{repl.restaurant.name}</b>, replace one of your carts. The items in the cart you pick will be removed.</p></div><button type="button" className="rpl-x" aria-label="Close" onClick={() => setRepl(null)}><X size={18} /></button></div>
      <div className="rpl-list">{carts.map((c, i) => <div key={c.restaurant._id} className="rpl-row"><div className="grow"><div className="rpl-n">Cart {i + 1}</div><div className="ell">{c.restaurant.name}</div><div className="muted">{c.items.reduce((a, z) => a + z.qty, 0)} items · {inr(c.items.reduce((a, z) => a + z.qty * z.price, 0))}</div></div><button type="button" className="btn sm" onClick={() => replaceCart(c.restaurant._id)}>Replace</button></div>)}</div>
      <button type="button" className="btn line block" onClick={() => setRepl(null)}>Cancel</button></div></div>}{toastMsg && <div className="toast">{toastMsg}</div>}</Ctx.Provider>;
}
