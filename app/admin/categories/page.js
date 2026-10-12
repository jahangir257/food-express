'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { useApp } from '@/components/Providers';
import { Icon, Img, ImageField, Modal, Toggle } from '@/components/ui';
const blank = { name: '', image: '', emoji: '', order: 0, active: true };
export default function Categories() {
  const { ask } = useApp();
  const [list, setList] = useState(null), [e, setE] = useState(null), [err, setErr] = useState('');
  const load = () => api('/api/admin/categories').then((d) => setList(d.categories));
  useEffect(() => { load(); }, []);
  const save = async (ev) => { ev.preventDefault(); setErr(''); try { await api('/api/admin/categories', { method: e._id ? 'PUT' : 'POST', body: { ...e, id: e._id } }); setE(null); load(); } catch (x) { setErr(x.message); } };
  return (<><div className="row between" style={{ marginBottom: 16 }}><p className="muted">Shown as round images on the customer home page. Tapping one filters restaurants by that cuisine.</p><button className="btn" onClick={() => setE(blank)}><Icon n="plus" s={17} />Add category</button></div>
    <div className="kpis">{(list || []).map((c) => <div key={c._id} className="card" style={{ textAlign: 'center', opacity: c.active ? 1 : .5 }}>
      <Img src={c.image} emoji={c.emoji || '🍽️'} style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', margin: '0 auto' }} /><h3 style={{ margin: '10px 0' }}>{c.name}{c.isNew && <span className="newb">NEW</span>}</h3>{c.byRole === 'restaurant' && <div className="muted" style={{ marginBottom: 6 }}>Added by owner</div>}
      <div className="row" style={{ justifyContent: 'center' }}><button className="btn line sm" onClick={() => setE(c)}>Edit</button><button className="btn line sm" onClick={async () => { if (await ask({ title: `Delete “${c.name}”?`, message: 'This category will be removed for everyone. This cannot be undone.' })) { await api('/api/admin/categories?id=' + c._id, { method: 'DELETE' }); load(); } }}>Delete</button></div></div>)}</div>
    <Modal open={!!e} onClose={() => setE(null)} title={e?._id ? 'Edit category' : 'New category'}>{e && <form onSubmit={save}>
      <div className="field"><label>Name</label><input required value={e.name} onChange={(x) => setE({ ...e, name: x.target.value })} /></div>
      <ImageField value={e.image} onChange={(v) => setE({ ...e, image: v })} prompt={e.name && e.name + ' dish'} />
      <div className="row"><div className="field grow"><label>Emoji fallback</label><input value={e.emoji} onChange={(x) => setE({ ...e, emoji: x.target.value })} /></div><div className="field grow"><label>Sort order</label><input type="number" value={e.order} onChange={(x) => setE({ ...e, order: x.target.value })} /></div></div>
      <div className="row"><span>Visible</span><Toggle on={e.active} onChange={(v) => setE({ ...e, active: v })} /></div>{err && <div className="err">{err}</div>}<button className="btn block" style={{ marginTop: 12 }}>Save</button></form>}</Modal></>);
}
