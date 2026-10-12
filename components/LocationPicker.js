'use client';
import { useEffect, useState } from 'react';
import { getPosition } from '@/lib/client';
import { useApp } from './Providers';
import { Icon } from './ui';
const NOM = 'https://nominatim.openstreetmap.org';
export default function LocationPicker({ onPick, hideSaved }) {
  const { user, addresses } = useApp();
  const [q, setQ] = useState(''), [res, setRes] = useState([]), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const saved = !hideSaved && user && user.role === 'customer' ? [...addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)) : [];
  useEffect(() => {
    if (q.trim().length < 3) return setRes([]);
    const t = setTimeout(async () => {
      try { const d = await (await fetch(`${NOM}/search?format=json&limit=6&countrycodes=in&q=${encodeURIComponent(q)}`)).json(); setRes(d.map((x) => ({ lat: +x.lat, lng: +x.lon, label: x.display_name }))); } catch { setErr('Search unavailable'); }
    }, 500);
    return () => clearTimeout(t);
  }, [q]);
  const gps = async () => {
    setBusy(true); setErr('');
    try {
      const p = await getPosition(); let label = 'Current location';
      try { label = (await (await fetch(`${NOM}/reverse?format=json&lat=${p.lat}&lon=${p.lng}`)).json()).display_name || label; } catch {}
      onPick({ ...p, label });
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  return (<div>
    <button type="button" className="btn line block" onClick={gps} disabled={busy}><Icon n="pin" s={18} /> {busy ? 'Detecting…' : 'Use my current location'}</button>
    {saved.length > 0 && <div className="lp-saved"><h6>Saved addresses</h6>{saved.map((a) => (
      <button type="button" key={a._id} className="lp-addr" onClick={() => onPick({ lat: a.lat, lng: a.lng, label: a.area, addressId: a._id })}>
        <Icon n="pin" s={16} /><span className="grow"><b>{a.type}{a.isDefault && <em>Default</em>}</b><span className="ell">{a.line}{a.landmark ? `, ${a.landmark}` : ''}</span><small className="ell">{a.area}</small></span></button>))}</div>}
    <div className="field"><input autoFocus={!saved.length} placeholder="Search area, street, landmark…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
    {err && <div className="err">{err}</div>}
    {res.map((r, i) => <div key={i} className="res" onClick={() => onPick(r)}>{r.label}</div>)}
  </div>);
}
