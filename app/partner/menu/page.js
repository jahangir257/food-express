'use client';
import Skeleton from '@/components/Skeleton';
import Select from '@/components/Select';
import { useEffect, useState } from 'react';
import { api, inr } from '@/lib/client';
import { useApp } from '@/components/Providers';
import { Icon, Img, ImageField, Modal, Toggle, Veg } from '@/components/ui';
const blank = { name: '', description: '', price: '', category: '', veg: true, tags: '', image: '', available: true };
export default function Menu() {
  const { ask } = useApp();
  const [menu, setMenu] = useState(null), [allCats, setAllCats] = useState([]), [e, setE] = useState(null), [err, setErr] = useState(''), [ai, setAi] = useState(false);
  const [newCat, setNewCat] = useState(''), [addingCat, setAddingCat] = useState(false);
  const load = () => api('/api/partner/menu').then((d) => setMenu(d.menu));
  const loadCats = () => api('/api/categories').then((d) => setAllCats(d.categories));
  useEffect(() => { load(); loadCats(); }, []);
  const save = async (ev) => { ev.preventDefault(); setErr(''); if (!e.category) return setErr('Please select a category'); try { await api('/api/partner/menu', { method: e._id ? 'PUT' : 'POST', body: { ...e, id: e._id } }); setE(null); load(); } catch (x) { setErr(x.message); } };
  const quick = async (m, patch) => { await api('/api/partner/menu', { method: 'PUT', body: { ...m, tags: (m.tags || []).join(','), id: m._id, ...patch } }); load(); };
  const aiDesc = async () => { setAi(true); setErr(''); try { const d = await api('/api/ai/describe', { method: 'POST', body: e }); setE({ ...e, description: d.description, tags: d.tags }); } catch (x) { setErr(x.message); } setAi(false); };
  const createCat = async () => { if (!newCat.trim()) return; setErr(''); try { const d = await api('/api/partner/categories', { method: 'POST', body: { name: newCat } }); await loadCats(); setE({ ...e, category: d.category.name }); setNewCat(''); setAddingCat(false); } catch (x) { setErr(x.message); } };
  const used = [...new Set((menu || []).map((m) => m.category))];
  const opts = [...new Set([...allCats.map((c) => c.name), ...used, e?.category].filter(Boolean))];
  const isNew = (n) => allCats.find((c) => c.name === n)?.isNew;
  return (<><div className="row between wrap" style={{ marginBottom: 16 }}><span className="muted">{menu?.length || 0} items</span><button className="btn" onClick={() => { setE(blank); setAddingCat(false); setErr(''); }}><Icon n="plus" s={17} />Add dish</button></div>
    {!menu ? <Skeleton type="list" /> : used.map((c) => <div key={c} className="card" style={{ marginBottom: 16 }}><h3 style={{ marginBottom: 6 }}>{c}{isNew(c) && <span className="newb">NEW</span>}</h3>{menu.filter((m) => m.category === c).map((m) => (
      <div key={m._id} className="dmrow"><Img src={m.image} style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flex: 'none' }} />
        <div className="grow"><Veg veg={m.veg} /><b>{m.name}</b><div className="muted">{inr(m.price)} · {m.description?.slice(0, 70)}</div></div>
        <div className="dm-act"><span className="muted">{m.available ? 'In stock' : 'Out'}</span><Toggle on={m.available} onChange={(v) => quick(m, { available: v })} />
          <button className="btn line sm" onClick={() => { setE({ ...m, tags: (m.tags || []).join(', ') }); setAddingCat(false); setErr(''); }}><Icon n="pencil" s={14} />Edit</button>
          <button className="btn line sm" onClick={async () => { if (await ask({ title: `Delete “${m.name}”?`, message: 'This dish will be removed from your menu. This cannot be undone.' })) { await api('/api/partner/menu?id=' + m._id, { method: 'DELETE' }); load(); } }}><Icon n="trash" s={14} /></button></div></div>))}</div>)}
    <Modal open={!!e} onClose={() => setE(null)} title={e?._id ? 'Edit dish' : 'Add dish'}>{e && <form onSubmit={save}>
      <div className="field"><label>Dish name</label><input required value={e.name} onChange={(x) => setE({ ...e, name: x.target.value })} /></div>
      <ImageField value={e.image} onChange={(v) => setE({ ...e, image: v })} prompt={e.name} label="Dish photo" />
      <div className="field"><label>Description</label><textarea rows={2} value={e.description} onChange={(x) => setE({ ...e, description: x.target.value })} /><button type="button" className="btn line sm" style={{ marginTop: 6 }} onClick={aiDesc} disabled={!e.name || ai}><Icon n="spark" s={14} />{ai ? 'Writing…' : 'Write with AI'}</button></div>
      <div className="fg"><div className="field"><label>Price (₹)</label><input type="number" min="1" required value={e.price} onChange={(x) => setE({ ...e, price: x.target.value })} /></div>
        <div className="field"><label>Category</label>
          <Select required value={e.category} onChange={(x) => x.target.value === '__new' ? setAddingCat(true) : setE({ ...e, category: x.target.value })}>
            <option value="">Select category…</option>{opts.map((c) => <option key={c} value={c}>{c}{isNew(c) ? ' (NEW)' : ''}</option>)}<option value="__new">+ Create new category…</option></Select></div></div>
      {addingCat && <div className="field newcat"><label>New category name</label><div className="row"><input autoFocus value={newCat} onChange={(x) => setNewCat(x.target.value)} placeholder="e.g. Biryani" /><button type="button" className="btn sm" onClick={createCat}>Add</button><button type="button" className="btn line sm" onClick={() => setAddingCat(false)}>Cancel</button></div><span className="muted">New categories are marked NEW and appear for customers and the admin.</span></div>}
      <div className="row wrap"><label className="row"><input type="checkbox" checked={e.veg} onChange={(x) => setE({ ...e, veg: x.target.checked })} />Vegetarian</label><label className="row"><input type="checkbox" checked={e.available !== false} onChange={(x) => setE({ ...e, available: x.target.checked })} />Available</label></div>
      {err && <div className="err">{err}</div>}<button className="btn block" style={{ marginTop: 12 }}>Save dish</button></form>}</Modal></>);
}
