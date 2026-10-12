'use client';
import { useEffect, useState } from 'react';
import Select from '@/components/Select';
import { api, offerText } from '@/lib/client';
import { Modal, Toggle, PageHead } from './ui';
import { useApp } from './Providers';
const blank = { code: '', description: '', type: 'percent', value: '', maxDiscount: '', minOrder: '', usageLimit: '', perUserLimit: 1, firstOrderOnly: false, validFrom: '', validTo: '', active: true };
const day = (d) => (d ? String(d).slice(0, 10) : '');
export default function CouponManager({ endpoint, showScope }) {
  const { ask } = useApp();
  const [list, setList] = useState(null), [e, setE] = useState(null), [err, setErr] = useState('');
  const load = () => api(endpoint).then((d) => setList(d.coupons));
  useEffect(() => { load(); }, []);
  const save = async (ev) => { ev.preventDefault(); setErr(''); try { await api(endpoint, { method: e._id ? 'PUT' : 'POST', body: { ...e, id: e._id } }); setE(null); load(); } catch (x) { setErr(x.message); } };
  const toggle = async (c, active) => { await api(endpoint, { method: 'PUT', body: { ...c, id: c._id, active } }); load(); };
  const set = (k) => (ev) => setE({ ...e, [k]: ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value });
  return (<><PageHead title="Coupons" sub={showScope ? 'Platform coupons are funded by you; restaurant coupons are funded by the restaurant.' : 'Coupons you create are funded by your restaurant and only work on your menu.'}><button className="btn" onClick={() => setE({ ...blank })}>+ New coupon</button></PageHead>
    <div className="card tblw"><table className="tbl"><thead><tr><th>Code</th><th>Offer</th><th>Min order</th><th>Used</th><th>Valid till</th>{showScope && <th>Applies to</th>}<th>Active</th><th></th></tr></thead><tbody>
      {!list ? <tr><td colSpan="8" className="muted">Loading…</td></tr> : !list.length ? <tr><td colSpan="8" className="muted">No coupons yet.</td></tr> : list.map((c) => <tr key={c._id}>
        <td><b style={{ letterSpacing: 1 }}>{c.code}</b><div className="muted">{c.description}</div></td><td>{offerText({ ...c, minOrder: 0 })}{c.firstOrderOnly && <div className="muted">First order only</div>}</td><td>₹{c.minOrder || 0}</td><td>{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td><td>{c.validTo ? day(c.validTo) : '—'}</td>
        {showScope && <td>{c.scope === 'restaurant' ? <span className="pill">{c.restaurant?.name || 'Restaurant'}</span> : <span className="pill p">All restaurants</span>}</td>}
        <td><Toggle on={c.active} onChange={(v) => toggle(c, v)} /></td>
        <td><div className="row"><button className="btn line sm" onClick={() => setE({ ...c, validFrom: day(c.validFrom), validTo: day(c.validTo) })}>Edit</button><button className="btn line sm" onClick={async () => { if (await ask({ title: `Delete coupon ${c.code}?`, message: 'Customers will no longer be able to use this coupon. This cannot be undone.' })) { await api(endpoint + '?id=' + c._id, { method: 'DELETE' }); load(); } }}>Delete</button></div></td></tr>)}</tbody></table></div>
    <Modal open={!!e} onClose={() => setE(null)} title={e?._id ? 'Edit coupon' : 'New coupon'}>{e && <form onSubmit={save}>
      <div className="fg"><div className="field"><label>Coupon code</label><input required value={e.code} onChange={(x) => setE({ ...e, code: x.target.value.toUpperCase() })} placeholder="WELCOME50" /></div>
        <div className="field"><label>Description</label><input value={e.description || ''} onChange={set('description')} placeholder="Shown to customers" /></div>
        <div className="field"><label>Discount type</label><Select value={e.type} onChange={set('type')}><option value="percent">Percentage (%)</option><option value="flat">Flat amount (₹)</option></Select></div>
        <div className="field"><label>{e.type === 'percent' ? 'Percent off' : 'Amount off (₹)'}</label><input type="number" min="1" required value={e.value} onChange={set('value')} /></div>
        {e.type === 'percent' && <div className="field"><label>Max discount (₹, 0 = none)</label><input type="number" min="0" value={e.maxDiscount} onChange={set('maxDiscount')} /></div>}
        <div className="field"><label>Minimum order (₹)</label><input type="number" min="0" value={e.minOrder} onChange={set('minOrder')} /></div>
        <div className="field"><label>Total usage limit (0 = unlimited)</label><input type="number" min="0" value={e.usageLimit} onChange={set('usageLimit')} /></div>
        <div className="field"><label>Per customer limit (0 = unlimited)</label><input type="number" min="0" value={e.perUserLimit} onChange={set('perUserLimit')} /></div>
        <div className="field"><label>Valid from</label><input type="date" value={e.validFrom || ''} onChange={set('validFrom')} /></div>
        <div className="field"><label>Valid until</label><input type="date" value={e.validTo || ''} onChange={set('validTo')} /></div></div>
      <label className="row" style={{ margin: '8px 0' }}><input type="checkbox" checked={!!e.firstOrderOnly} onChange={set('firstOrderOnly')} />First order only</label>
      <label className="row" style={{ margin: '8px 0' }}><input type="checkbox" checked={e.active !== false} onChange={set('active')} />Active</label>
      {err && <div className="err">{err}</div>}<button className="btn block" style={{ marginTop: 10 }}>Save coupon</button></form>}</Modal></>);
}
