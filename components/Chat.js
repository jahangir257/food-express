'use client';
import { useState, useRef, useEffect } from 'react';
import { api, inr } from '@/lib/client';
import Link from 'next/link';
import { Img, Veg, Stepper, Rating } from './ui';
import { useApp } from './Providers';
import { Bot, Send, X } from 'lucide-react';
export default function Chat() {
  const { loc, add, change, qtyOf } = useApp();
  const [open, setOpen] = useState(false), [text, setText] = useState(''), [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState([{ role: 'bot', text: 'Hi! Tell me what you are craving and I will suggest dishes nearby ' }]);
  const end = useRef();
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);
  const send = async () => {
    const message = text.trim(); if (!message || busy) return;
    const history = msgs.map((m) => ({ role: m.role === 'bot' ? 'bot' : 'user', text: m.text }));
    setMsgs((m) => [...m, { role: 'user', text: message }]); setText(''); setBusy(true);
    try { const d = await api('/api/ai/chat', { method: 'POST', body: { message, history, ...loc } }); setMsgs((m) => [...m, { role: 'bot', text: d.reply, products: d.products || [], restaurants: d.restaurants || [] }]); }
    catch (e) { setMsgs((m) => [...m, { role: 'bot', text: e.message }]); }
    setBusy(false);
  };
  const fmt = (t) => String(t).replace(/^\s*\*\s+/gm, '• ').split(/(\*\*[^*]+\*\*)/g).map((x, i) => x.startsWith('**') && x.endsWith('**') && x.length > 4 ? <b key={i}>{x.slice(2, -2)}</b> : x.replace(/\*/g, ''));
  const rest = (r) => (<div key={r._id} className="crest"><Link href={'/restaurant/' + r._id} className="crest-h"><Img src={r.image} style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'cover', flex: 'none' }} />
    <div className="grow"><div className="ell"><b style={{ fontWeight: 400 }}>{r.name}</b></div><div className="muted ell">{(r.cuisines || []).join(', ')}{r.distanceKm !== undefined ? ` · ${r.distanceKm} km` : ''}{r.prepMinutes ? ` · ${r.prepMinutes} min` : ''}</div></div><Rating v={r.rating} /></Link>
    {r.products?.length > 0 && <div className="crest-p">{r.products.map((p) => prod(p, true))}</div>}</div>);
  const prod = (p, small) => { const q = qtyOf(p.restaurant._id, p._id); return (<div key={p._id} className={'cprod' + (small ? ' sm' : '')}><Img src={p.image} style={{ width: small ? 32 : 46, height: small ? 32 : 46, borderRadius: 8, objectFit: 'cover', flex: 'none' }} />
    <div className="grow"><div className="ell"><Veg veg={p.veg} /><b style={{ fontWeight: 400 }}>{p.name}</b></div><div className="muted ell">{p.restaurant.name} · {inr(p.price)}</div></div>
    {q ? <Stepper q={q} onMinus={() => change(p.restaurant._id, p._id, -1)} onPlus={() => change(p.restaurant._id, p._id, 1)} /> : <button className="btn sm" onClick={() => add(p.restaurant, p)}>Add</button>}</div>); };
  return (
    <div className="chat">
      {open && <div className="chatbox"><div className="msgs">{msgs.map((m, i) => <div key={i} className={'m ' + (m.role === 'user' ? 'u' : 'b')}>{m.role === 'user' ? m.text : fmt(m.text)}{m.restaurants?.length > 0 && <div className="cprods">{m.restaurants.map(rest)}</div>}{m.products?.length > 0 && <div className="cprods">{m.products.map((p) => prod(p))}</div>}</div>)}{busy && <div className="m b">…</div>}<div ref={end} /></div>
        <div className="row" style={{ padding: 8 }}><input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask AI for ideas…" /><button className="btn sm" onClick={send} aria-label="Send"><Send size={16} /></button></div></div>}
      <button className="btn chatfab" onClick={() => setOpen(!open)} aria-label="AI Assistant">{open ? <X size={20} /> : <Bot size={20} />}<span>AI Assistant</span></button>
    </div>
  );
}
