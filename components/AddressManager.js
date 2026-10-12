'use client';
import { useState } from 'react';
import { api } from '@/lib/client';
import { useApp } from './Providers';
import { Icon, Modal, Empty } from './ui';
import LocationPicker from './LocationPicker';
import { Home, Briefcase, MapPin, Star, Pencil, Trash2, Plus } from 'lucide-react';
const TYPES = [['Home', Home], ['Work', Briefcase], ['Other', MapPin]];
const blank = (user) => ({ type: 'Home', name: user?.name || '', phone: user?.phone || '', line: '', landmark: '', area: '', pincode: '', instructions: '', lat: null, lng: null, isDefault: false });
export const blankAddress = blank;
// All address fields (no submit button) — used by the address book form AND inline at checkout
export function AddressFields({ a, setA, showDefault = true, noArea = false, defaultLabel = 'Make this my default address' }) {
  const [pick, setPick] = useState(!a.area);
  const set = (k) => (e) => setA({ ...a, [k]: e.target.value });
  return (<>
    <div className="atypes">{TYPES.map(([t, I]) => <button type="button" key={t} className={a.type === t ? 'on' : ''} onClick={() => setA({ ...a, type: t })}><I size={16} />{t}</button>)}</div>
    {!noArea && <div className="field"><label>Area / locality</label>
      {a.area && !pick ? <div className="row"><div className="grow apin"><Icon n="pin" s={16} /> {a.area}</div><button type="button" className="btn line sm" onClick={() => setPick(true)}>Change</button></div>
        : <LocationPicker hideSaved onPick={(l) => { setA({ ...a, area: l.label, lat: l.lat, lng: l.lng }); setPick(false); }} />}</div>}
    <div className="field"><label>Flat / house no., building</label><input required value={a.line} onChange={set('line')} placeholder="e.g. Flat 4B, Green Apartments" /></div>
    <div className="fg"><div className="field"><label>Landmark (optional)</label><input value={a.landmark} onChange={set('landmark')} placeholder="Near City Mall" /></div>
      <div className="field"><label>Pincode</label><input inputMode="numeric" value={a.pincode} onChange={set('pincode')} /></div></div>
    <div className="fg"><div className="field"><label>Receiver name</label><input value={a.name} onChange={set('name')} /></div>
      <div className="field"><label>Phone</label><input required type="tel" inputMode="tel" value={a.phone} onChange={set('phone')} /></div></div>
    <div className="field"><label>Delivery instructions (optional)</label><input value={a.instructions} onChange={set('instructions')} placeholder="e.g. Ring the bell twice" /></div>
    {showDefault && <label className="row" style={{ margin: '4px 0 8px' }}><input type="checkbox" checked={!!a.isDefault} onChange={(e) => setA({ ...a, isDefault: e.target.checked })} />{defaultLabel}</label>}
  </>);
}
export function AddressForm({ initial, onSaved, onCancel }) {
  const { user, loadAddresses } = useApp();
  const [a, setA] = useState(initial || blank(user)), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { const d = await api(a._id ? '/api/addresses/' + a._id : '/api/addresses', { method: a._id ? 'PUT' : 'POST', body: a }); await loadAddresses(); onSaved?.(d.address); } catch (x) { setErr(x.message); }
    setBusy(false);
  };
  return (<form onSubmit={save}>
    <AddressFields a={a} setA={setA} />
    {err && <div className="err">{err}</div>}
    <div className="row"><button className="btn grow" disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button>{onCancel && <button type="button" className="btn line" onClick={onCancel}>Cancel</button>}</div>
  </form>);
}
export default function AddressManager() {
  const { addresses, loadAddresses, setLoc, ask } = useApp(), [edit, setEdit] = useState(null);
  const del = async (a) => { if (await ask({ title: 'Delete this address?', message: `${a.type} · ${a.line}${a.area ? ', ' + a.area : ''}`, confirmText: 'Delete' })) { await api('/api/addresses/' + a._id, { method: 'DELETE' }); loadAddresses(); } };
  const def = async (a) => { await api('/api/addresses/' + a._id, { method: 'PUT', body: { makeDefault: true } }); loadAddresses(); };
  return (<div>
    <div className="row between wrap" style={{ marginBottom: 14 }}><span className="muted">{addresses.length} saved address{addresses.length === 1 ? '' : 'es'}</span><button className="btn" onClick={() => setEdit({})}><Plus size={17} />Add new address</button></div>
    {!addresses.length ? <Empty title="No saved addresses yet" sub="Save your home, work or any other place for faster checkout." /> :
      <div className="agrid">{addresses.map((a) => { const I = (TYPES.find((t) => t[0] === a.type) || TYPES[2])[1]; return (
        <div key={a._id} className={'acard' + (a.isDefault ? ' def' : '')}>
          <div className="row between"><span className="atype"><I size={16} />{a.type}</span>{a.isDefault && <span className="pill ok">Default</span>}</div>
          <div className="aline">{a.line}{a.landmark ? `, ${a.landmark}` : ''}</div><div className="muted aarea">{a.area}{a.pincode ? ` - ${a.pincode}` : ''}</div>
          <div className="muted" style={{ fontSize: 13 }}>{a.name}{a.name && a.phone ? ' · ' : ''}{a.phone}</div>
          {a.instructions && <div className="muted" style={{ fontSize: 13 }}>“{a.instructions}”</div>}
          <div className="aact"><button className="btn line sm" onClick={() => setEdit(a)}><Pencil size={14} />Edit</button>
            {!a.isDefault && <button className="btn line sm" onClick={() => def(a)}><Star size={14} />Set default</button>}
            <button className="btn line sm" onClick={() => { setLoc({ lat: a.lat, lng: a.lng, label: a.area, addressId: a._id }); }}><MapPin size={14} />Deliver here</button>
            <button className="btn line sm dng" onClick={() => del(a)} aria-label="Delete"><Trash2 size={14} /></button></div></div>); })}</div>}
    <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?._id ? 'Edit address' : 'Add new address'}>{edit && <AddressForm initial={edit._id ? edit : null} onSaved={() => setEdit(null)} onCancel={() => setEdit(null)} />}</Modal>
  </div>);
}
