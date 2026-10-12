'use client';
import Link from 'next/link';
import Script from 'next/script';
import { useEffect, useMemo, useRef, useState } from 'react';
import Slider from '@/components/Slider';
import Skeleton, { Sk } from '@/components/Skeleton';
import { api, inr, offerText } from '@/lib/client';
import { useApp } from '@/components/Providers';
import { Icon, Img, Veg, Empty, Stepper, Modal } from '@/components/ui';
import { CreditCard, Banknote, ShieldCheck, Eye, Pencil, Check, Plus, Minus, Tag, Trash2, MapPin, AlertCircle, X as XIcon } from 'lucide-react';
import { AddressForm, AddressFields, blankAddress } from '@/components/AddressManager';
export default function Cart() {
  const { carts, change, removeCart, user, loc, setLoc, setLocOpen, settings, ready: appReady, addresses, ask, cartLoaded } = useApp();
  const [open, setOpen] = useState([]), [peek, setPeek] = useState(null), [inc, setInc] = useState([]), [f, setF] = useState({ phone: '', notes: '', method: 'online' }), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const [newA, setNewA] = useState(() => blankAddress(null)), [saveAddr, setSaveAddr] = useState(true), [viewA, setViewA] = useState(null), [editA, setEditA] = useState(null);
  const [coupons, setCoupons] = useState({}), [codes, setCodes] = useState({}), [cerrs, setCerrs] = useState({}), [avail, setAvail] = useState({}), [quotes, setQuotes] = useState(null);
  const inited = useRef(false), lastAddr = useRef(), lastLoc = useRef();

  // The cart you came from (or Cart 1) is in the order and open by default; other carts can be added with "Add to this order"
  useEffect(() => {
    if (!cartLoaded || !carts.length) return;
    if (!inited.current) { inited.current = true; const r = new URLSearchParams(location.search).get('r'), first = carts.find((c) => c.restaurant._id === r) || carts[0]; setOpen([first.restaurant._id]); setInc([first.restaurant._id]); return; }
    setOpen((o) => o.filter((id) => carts.some((c) => c.restaurant._id === id)));
    setPeek((p) => (p && carts.some((c) => c.restaurant._id === p) ? p : null));
    setInc((x) => { const k = x.filter((id) => carts.some((c) => c.restaurant._id === id)); return k.length ? (k.length === x.length ? x : k) : [carts[0].restaurant._id]; });
  }, [carts, cartLoaded]);
  const incCarts = useMemo(() => carts.filter((c) => inc.includes(c.restaurant._id)), [carts, inc]);
  const toggleInc = (rid) => { if (!inc.includes(rid)) { setPeek((p) => (p === rid ? null : p)); setOpen((o) => (o.includes(rid) ? o : [...o, rid])); } setInc((x) => (x.includes(rid) ? (x.length > 1 ? x.filter((i) => i !== rid) : x) : [...x, rid])); };
  const toggleOpen = (rid) => setOpen((o) => (o.includes(rid) ? o.filter((i) => i !== rid) : [...o, rid]));

  // ---- delivery address follows the selected location: saved address -> just confirm phone; anything else -> fill in the address fields ----
  const saved = addresses.find((a) => a._id === loc?.addressId), isNew = !saved;
  const pickAddr = (a) => setLoc({ lat: a.lat, lng: a.lng, label: a.area, addressId: a._id });
  useEffect(() => { if (appReady && user && !loc && addresses.length) pickAddr(addresses.find((x) => x.isDefault) || addresses[0]); }, [addresses, appReady, user]); // nothing chosen yet: start from the default address
  useEffect(() => { // choosing a saved address pre-fills phone + instructions
    if (!saved || lastAddr.current === saved._id) return; lastAddr.current = saved._id;
    setF((x) => ({ ...x, phone: saved.phone || user?.phone || x.phone, notes: saved.instructions || '' }));
  }, [saved?._id]);
  useEffect(() => { // a different new location needs its own flat / house number
    const k = loc ? `${loc.lat},${loc.lng}` : ''; if (lastLoc.current !== undefined && lastLoc.current !== k && !saved) setNewA((x) => ({ ...x, line: '', landmark: '', pincode: '' })); lastLoc.current = k;
  }, [loc?.lat, loc?.lng]);
  useEffect(() => { if (user) { setNewA((x) => ({ ...x, name: x.name || user.name || '', phone: x.phone || user.phone || '' })); setF((x) => ({ ...x, phone: x.phone || user.phone || '' })); } }, [user]);
  const dest = loc?.lat != null && loc?.lng != null ? { lat: loc.lat, lng: loc.lng } : null;
  const phone = (isNew ? newA.phone : f.phone) || '';
  const addrLine = isNew ? (newA.line.trim() ? [newA.line.trim(), newA.landmark?.trim(), loc?.label].filter(Boolean).join(', ') : '') : [saved.line, saved.landmark, saved.area].filter(Boolean).join(', ');
  const addrOk = !!dest && (isNew ? !!newA.line.trim() && !!newA.phone.trim() : true);

  // ---- coupons are per restaurant ----
  const ids = incCarts.map((c) => c.restaurant._id).join(',');
  useEffect(() => { incCarts.forEach((c) => { const rid = c.restaurant._id; if (!avail[rid]) api('/api/coupons?restaurantId=' + rid).then((d) => setAvail((a) => ({ ...a, [rid]: d.coupons }))).catch(() => setAvail((a) => ({ ...a, [rid]: [] }))); }); }, [ids]);
  const apply = (rid, c) => { const v = (c || codes[rid] || '').trim().toUpperCase(); if (!v) return; setCerrs((e) => ({ ...e, [rid]: '' })); setCodes((x) => ({ ...x, [rid]: v })); setCoupons((x) => ({ ...x, [rid]: v })); };
  const unapply = (rid) => { setCerrs((e) => ({ ...e, [rid]: '' })); setCoupons((x) => ({ ...x, [rid]: '' })); setCodes((x) => ({ ...x, [rid]: '' })); };
  const key = useMemo(() => JSON.stringify([incCarts.map((c) => [c.restaurant._id, c.items.map((i) => [i._id, i.qty]), coupons[c.restaurant._id] || '']), dest?.lat, dest?.lng]), [incCarts, coupons, dest?.lat, dest?.lng]);
  const body = (extra = {}) => ({
    orders: incCarts.map((c) => ({ restaurantId: c.restaurant._id, items: c.items.map((i) => ({ itemId: i._id, qty: i.qty })), couponCode: coupons[c.restaurant._id] || undefined })),
    address: { line: addrLine, phone, lat: dest?.lat, lng: dest?.lng },
    ...(isNew ? (saveAddr ? { newAddress: { ...newA, area: loc?.label, lat: dest?.lat, lng: dest?.lng, isDefault: true } } : {}) : { addressId: saved._id }), ...extra });
  useEffect(() => {
    setErr(''); if (!incCarts.length || !dest || !user || user.role !== 'customer') return setQuotes(null);
    let live = true;
    api('/api/orders', { method: 'POST', body: body({ quote: true, newAddress: undefined }) }).then((d) => {
      if (!live) return; setQuotes(d);
      // keep a coupon error on screen until the customer edits / applies another code — clearing the bad coupon triggers a re-quote that must not wipe the message
      const ce = {}, okIds = []; d.quotes.forEach((x) => { if (x.pricing?.couponError) ce[x.restaurantId] = x.pricing.couponError; else if (x.pricing?.couponCode) okIds.push(x.restaurantId); });
      setCerrs((e) => { const n = { ...e, ...ce }; okIds.forEach((k) => { delete n[k]; }); return n; });
      if (Object.keys(ce).length) setCoupons((c) => { const n = { ...c }; Object.keys(ce).forEach((k) => { n[k] = ''; }); return n; });
    }).catch((e) => { if (live) { setQuotes(null); setErr(e.message); } });
    return () => { live = false; };
  }, [key, user]);
  const qOf = (rid) => quotes?.quotes.find((x) => x.restaurantId === rid);
  const blocked = incCarts.some((c) => qOf(c.restaurant._id)?.error);

  const place = async () => {
    setBusy(true); setErr('');
    try {
      const o = await api('/api/orders', { method: 'POST', body: body({ method: f.method, notes: f.notes }) });
      const many = (o.orderIds || [o.orderId]).length > 1, go = () => { incCarts.forEach((c) => removeCart(c.restaurant._id)); location.href = many ? '/orders' : '/orders/' + o.orderId; };
      if (o.method === 'cod') return go();
      const rz = new window.Razorpay({ key: o.keyId, amount: o.amount, currency: 'INR', order_id: o.razorpayOrderId, name: 'Foodie Express', theme: { color: '#EE3F24' },
        prefill: { name: user?.name, email: user?.email, contact: phone },
        handler: async (r) => { try { await api('/api/payments/verify', { method: 'POST', body: r }); go(); } catch (e) { setErr(e.message); } },
        modal: { ondismiss: () => setBusy(false) } });
      rz.on('payment.failed', (r) => { setErr(r.error?.description || 'Payment failed'); setBusy(false); });
      rz.open(); return;
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  if (!appReady || !cartLoaded) return <Skeleton type="checkout" />;
  if (!carts.length) return <div className="container"><Empty title="Your cart is empty" sub="Add something delicious from a restaurant."><Link href="/" className="btn" style={{ marginTop: 14 }}>Browse restaurants</Link></Empty></div>;
  if (user && user.role !== 'customer') return <div className="container"><p className="err" style={{ padding: 30 }}>Only customer accounts can place orders.</p></div>;
  const grand = quotes?.grandTotal || 0, multi = incCarts.length > 1;
  const ready = !busy && !!quotes && !blocked && addrOk && !!phone.trim(), cta = f.method === 'cod' ? `Place order · ${quotes ? inr(grand) : ''}` : `Pay ${quotes ? inr(grand) : ''}`;
  const hint = !dest ? 'Select your delivery location to continue' : isNew && !newA.line.trim() ? 'Add your flat / house no. to continue' : !phone.trim() ? 'Add your phone number to continue' : blocked ? 'A selected cart cannot be delivered to this address — remove it from the order to continue' : '';
  const free = settings?.freeDeliveryEnabled ? settings.freeDeliveryAbove : null;
  // carts you added to the order, in the order you added them (the slider on top lists every cart)
  const peekCart = peek && !inc.includes(peek) ? carts.find((c) => c.restaurant._id === peek) : null;
  const ordered = [...inc.map((id) => carts.find((c) => c.restaurant._id === id)).filter(Boolean), ...(peekCart ? [peekCart] : [])];
  const scrollTo = (rid) => setTimeout(() => document.getElementById('cx-' + rid)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
  const focusCart = (rid) => { setOpen((o) => (o.includes(rid) ? o : [...o, rid])); scrollTo(rid); };
  const viewCart = (rid) => { setPeek((p) => (p === rid ? null : rid)); scrollTo(rid); };
  const renderCart = (cart) => {
    const rid = cart.restaurant._id, n = carts.indexOf(cart) + 1, on = inc.includes(rid), isOpen = on ? open.includes(rid) : true, x = qOf(rid), q = x?.pricing;
    const count = cart.items.reduce((a, z) => a + z.qty, 0), sub = cart.items.reduce((s2, i) => s2 + i.price * i.qty, 0);
    const askRemove = async () => { if (await ask({ title: `Remove Cart ${n}?`, message: `All items from ${cart.restaurant.name} will be removed from your cart.`, confirmText: 'Remove' })) removeCart(rid); };
    return (<div key={rid} id={'cx-' + rid} className={'cx' + (on ? ' in' : '') + (isOpen ? ' open' : '')}>
      <div className="cx-h" role="button" tabIndex={0} aria-expanded={isOpen} onClick={() => (on ? toggleOpen(rid) : setPeek(null))} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), on ? toggleOpen(rid) : setPeek(null))}>
        <Img src={cart.restaurant.image} className="cx-img" />
        <div className="cx-t"><div className="cx-n">Cart {n}{on ? (carts.length > 1 && <i>In this order</i>) : <i className="off">Preview · not in order</i>}</div><div className="cx-r ell">{cart.restaurant.name}</div><div className="cx-m">{count} item{count > 1 ? 's' : ''} · {on && q ? inr(q.total) : inr(sub)}</div></div>
        <span className="cx-tg" aria-hidden="true">{!on ? <XIcon size={16} strokeWidth={2.4} /> : isOpen ? <Minus size={16} strokeWidth={2.4} /> : <Plus size={16} strokeWidth={2.4} />}</span>
      </div>
      {isOpen && <div className="cx-body">
        <div className="cx-items">{cart.items.map((i) => <div key={i._id} className="crow"><span className="nm"><Veg veg={i.veg} />{i.name}</span><Stepper q={i.qty} onMinus={async () => { if (i.qty > 1 || (await ask({ title: 'Remove this item?', message: `${i.name} will be removed from your cart.`, confirmText: 'Remove' }))) change(rid, i._id, -1); }} onPlus={() => change(rid, i._id, 1)} /><span className="pr">{inr(i.price * i.qty)}</span></div>)}</div>
        {!on && <div className="cx-prev"><div>Just looking? Close this. Want it delivered together?</div><button type="button" className="btn sm" onClick={() => toggleInc(rid)}><Plus size={14} strokeWidth={2.6} />Add to this order</button></div>}
        {on && <>
          <div className="cpx">
            {q?.couponCode ? <div className="cpx-ok"><Tag size={15} /><span className="grow"><b>{q.couponCode}</b> applied · you save {inr(q.discount)}</span><button type="button" onClick={() => unapply(rid)}>Remove</button></div>
              : <div className="cinp"><Tag size={16} className="cpx-ic" /><input aria-label="Coupon code" placeholder="Have a coupon code?" value={codes[rid] || ''} onChange={(e) => { setCerrs((o) => ({ ...o, [rid]: '' })); setCodes((o) => ({ ...o, [rid]: e.target.value.toUpperCase() })); }} onKeyDown={(e) => e.key === 'Enter' && apply(rid)} /><button className="btn sm" onClick={() => apply(rid)}>Apply</button></div>}
            {cerrs[rid] && <div className="cpx-err" role="alert"><AlertCircle size={15} /><span>{cerrs[rid]}</span></div>}
            {!q?.couponCode && (avail[rid] || []).length > 0 && <div className="cpx-chips">{(avail[rid] || []).slice(0, 3).map((k) => <button type="button" key={k.code} title={offerText(k)} onClick={() => apply(rid, k.code)}><b>{k.code}</b><span>{offerText(k)}</span></button>)}</div>}</div>
          {x?.error ? <div className="err" style={{ marginTop: 8 }}>{x.error}</div> : q ? <div className="bill"><div className="bh">Bill details</div><div><span>Item total</span><span>{inr(q.subtotal)}</span></div>
            {q.discount > 0 && <div className="save"><span>Coupon ({q.couponCode})</span><span>− {inr(q.discount)}</span></div>}
            <div><span>Delivery ({q.distanceKm} km)</span><span>{q.freeDelivery ? <><s>{inr(q.deliveryFeeFull)}</s><b className="save">FREE</b></> : inr(q.deliveryFee)}</span></div>
            {q.charges.map((ch) => <div key={ch.name}><span>{ch.name}</span><span>{inr(ch.amount)}</span></div>)}
            <div><span>Taxes ({q.taxPct}%)</span><span>{inr(q.tax)}</span></div>
            <div className="tot"><b>Cart total</b><b>{inr(q.total)}</b></div>
            {free && !q.freeDelivery && <div className="cx-free">Add {inr(free - q.subtotal)} more to get free delivery</div>}</div>
            : <div className="bill"><div><span>Item total</span><span>{inr(sub)}</span></div><p className="muted">{!user ? 'Log in to see delivery charges, taxes and apply coupons.' : !dest ? 'Select your location to see delivery charges.' : err || ''}</p>{user && dest && !err && [0, 1, 2].map((i) => <div key={i} className="row between" style={{ margin: '10px 0' }}><Sk w="40%" h={13} /><Sk w={60} h={13} /></div>)}</div>}</>}
        <div className="cx-foot"><Link href={'/restaurant/' + rid} className="cx-more"><Plus size={14} strokeWidth={2.6} />Add more items</Link>
          <span className="cx-acts">{!on && <button type="button" onClick={() => setPeek(null)}>Close preview</button>}{on && carts.length > 1 && inc.length > 1 && <button type="button" onClick={() => toggleInc(rid)}>Remove from order</button>}<button type="button" className="del" onClick={askRemove}><Trash2 size={14} />Delete cart</button></span></div>
      </div>}
    </div>);
  };

  return (<div className="container checkout"><Script src="https://checkout.razorpay.com/v1/checkout.js" />
    <div className="ck-head"><h1>Checkout</h1>
      <p className="muted">{carts.length > 1 ? (multi ? `You’re ordering from ${incCarts.length} restaurants in one payment.` : 'Tap “Add to this order” on another cart to pay for both together.') : 'Review your order and pay.'}</p></div>
    {carts.length > 1 && <Slider className="ctabs" deps={[carts.length]}>{carts.map((c, i) => { const r = c.restaurant._id, inn = inc.includes(r), pk = peek === r && !inn; return (
      <div key={r} className={'ctab' + (inn ? ' on' : '') + (pk ? ' view' : '')} onClick={() => (inn ? focusCart(r) : viewCart(r))} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && (inn ? focusCart(r) : viewCart(r))}>
        <Img src={c.restaurant.image} style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flex: 'none' }} />
        <div className="grow"><div className="n">CART {i + 1}</div><div className="ell">{c.restaurant.name}</div><div className="muted">{c.items.reduce((a, z) => a + z.qty, 0)} items · {inr(c.items.reduce((a, z) => a + z.qty * z.price, 0))}</div>
          <div className="ctacts">{!inn && <button type="button" className={'ctview' + (pk ? ' on' : '')} onClick={(e) => { e.stopPropagation(); viewCart(r); }}><Eye size={13} />{pk ? 'Hide items' : 'View items'}</button>}
            <button type="button" className={'ctick' + (inn ? ' on' : '')} aria-pressed={inn} onClick={(e) => { e.stopPropagation(); toggleInc(r); }}><span>{inn ? <Check size={12} strokeWidth={3} /> : <Plus size={12} strokeWidth={3} />}</span>{inn ? 'In this order' : 'Add to order'}</button></div></div>
        <button className="x" title="Remove this cart" onClick={async (e) => { e.stopPropagation(); if (await ask({ title: `Remove Cart ${i + 1}?`, message: `All items from ${c.restaurant.name} will be removed from your cart.`, confirmText: 'Remove' })) removeCart(r); }}><Icon n="x" s={14} /></button></div>); })}</Slider>}
    <div className="two">
      <div className="col">
        <div className="card ck-addr"><div className="ch"><h3><span className="sn">1</span>Delivery address</h3></div>
          <div className="dloc"><MapPin size={16} /><div className="grow ell">{loc?.label || <span className="muted">No location selected</span>}</div><button className="btn line sm" onClick={() => setLocOpen(true)}>{loc ? 'Change' : 'Select'}</button></div>
          {addresses.length > 0 && <><div className="muted ck-lbl">Your saved addresses</div><div className="saddr">{addresses.map((a) => <div role="button" tabIndex={0} key={a._id} className={'sa' + (saved?._id === a._id ? ' on' : '')} onClick={() => pickAddr(a)} onKeyDown={(e) => e.key === 'Enter' && pickAddr(a)}><b>{a.type}{a.isDefault && <em>Default</em>}</b><span>{a.line}{a.landmark ? `, ${a.landmark}` : ''}</span><small>{a.area}</small>
              <div className="sa-act"><button type="button" onClick={(e) => { e.stopPropagation(); setViewA(a); }}><Eye size={13} />View</button><button type="button" onClick={(e) => { e.stopPropagation(); setEditA(a); }}><Pencil size={13} />Edit</button></div></div>)}</div></>}
          {saved ? <div className="fg" style={{ marginTop: 6 }}><div className="field"><label>Phone</label><input type="tel" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile number" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
              <div className="field"><label>Cooking instructions (optional)</label><input placeholder="e.g. less spicy" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div></div>
            : dest ? <div className="newaddr"><div className="ck-lbl muted" style={{ marginTop: 0 }}>This location isn’t saved yet — add the address details</div><AddressFields a={newA} setA={setNewA} showDefault={false} noArea />
              <div className="field"><label>Cooking instructions (optional)</label><input placeholder="e.g. less spicy" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
              {user && <label className="row" style={{ margin: '4px 0 0' }}><input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} />Save this address &amp; make it my default after the order</label>}</div>
              : <div className="muted" style={{ marginTop: 6 }}>Select your delivery location above to continue.</div>}</div>
        <div className="card ck-pay"><div className="ch"><h3><span className="sn">2</span>Payment</h3></div>{[['online', 'Pay online', 'UPI, cards, netbanking', CreditCard], ['cod', 'Cash on delivery', 'Pay when your food arrives', Banknote]].map(([v, l, d, I]) => <label key={v} className={'payopt' + (f.method === v ? ' on' : '')}><input type="radio" name="pay" checked={f.method === v} onChange={() => setF({ ...f, method: v })} /><I size={22} /><div className="grow"><div>{l}</div><div className="muted">{d}</div></div><span className="rad" /></label>)}</div>
      </div>
      <div className="col">
        <div className="ck-cart cx-list">{ordered.map(renderCart)}</div>
        <div className="card ck-sum"><div className="ch"><h3>Order summary</h3></div>
          {quotes ? <div className="bill">{incCarts.map((c) => { const p = qOf(c.restaurant._id)?.pricing; return <div key={c.restaurant._id}><span className="ell">Cart {carts.indexOf(c) + 1} · {c.restaurant.name}</span><span>{p ? inr(p.total) : '—'}</span></div>; })}
            <div className="tot"><b>{multi ? `To pay · ${incCarts.length} restaurants` : 'To pay'}</b><b>{inr(grand)}</b></div></div>
            : <p className="muted">{!user ? 'Log in to see your total.' : !dest ? 'Select your delivery location to see your total.' : err || 'Calculating…'}</p>}
          {err && quotes && <div className="err">{err}</div>}
          {!user ? <Link href="/login?next=/cart" className="btn block" style={{ marginTop: 12 }}>Log in to continue</Link> :
            <><button className="btn block paydesk" style={{ marginTop: 12 }} disabled={!ready} onClick={place}>{cta}</button>{hint && <div className="err" style={{ textAlign: 'center' }}>{hint}</div>}<div className="secure muted"><ShieldCheck size={15} />Secure checkout</div></>}
          {carts.length > incCarts.length && <p className="muted" style={{ marginTop: 4, textAlign: 'center' }}>Carts you haven’t added to this order stay saved for later.</p>}</div>
      </div></div>
    {user && <div className="paybar2"><div className="pb-t"><small>{multi ? `${incCarts.length} restaurants` : 'To pay'}</small><b>{quotes ? inr(grand) : '—'}</b></div><button className="btn" disabled={!ready} onClick={place}>{busy ? 'Please wait…' : f.method === 'cod' ? 'Place order' : 'Pay now'}</button></div>}
    <Modal open={!!viewA} onClose={() => setViewA(null)} title="Saved address">{viewA && <div><div className="atype"><b>{viewA.type}</b>{viewA.isDefault && <span className="pill ok" style={{ marginLeft: 8 }}>Default</span>}</div><p style={{ margin: '10px 0 2px' }}>{viewA.line}{viewA.landmark ? `, ${viewA.landmark}` : ''}</p><div className="muted">{viewA.area}{viewA.pincode ? ` - ${viewA.pincode}` : ''}</div><div className="muted" style={{ marginTop: 6 }}>{viewA.name}{viewA.name && viewA.phone ? ' · ' : ''}{viewA.phone}</div>{viewA.instructions && <div className="muted" style={{ marginTop: 6 }}>“{viewA.instructions}”</div>}<div className="row" style={{ marginTop: 16 }}><button className="btn grow" onClick={() => { pickAddr(viewA); setViewA(null); }}>Deliver here</button><button className="btn line" onClick={() => { setEditA(viewA); setViewA(null); }}>Edit</button></div></div>}</Modal>
    <Modal open={!!editA} onClose={() => setEditA(null)} title="Edit address">{editA && <AddressForm initial={editA} onCancel={() => setEditA(null)} onSaved={(a) => { setEditA(null); if (saved?._id === a._id) pickAddr(a); }} />}</Modal>
    </div>);
}
