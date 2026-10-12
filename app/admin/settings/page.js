'use client';
import Skeleton from '@/components/Skeleton';
import Select from '@/components/Select';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { PageHead, Toggle } from '@/components/ui';
export default function Settings() {
  const [s, setS] = useState(null), [msg, setMsg] = useState(''), [err, setErr] = useState('');
  useEffect(() => { api('/api/admin/settings').then((d) => setS(d.settings)).catch((e) => setErr(e.message)); }, []);
  if (!s) return err ? <p className="muted">{err}</p> : <Skeleton type="list" />;
  const set = (k) => (e) => setS({ ...s, [k]: e.target.value });
  const ch = (i, k, v) => setS({ ...s, extraCharges: s.extraCharges.map((c, j) => (j === i ? { ...c, [k]: v } : c)) });
  const save = async (e) => { e.preventDefault(); setErr(''); setMsg(''); try { setS((await api('/api/admin/settings', { method: 'PUT', body: s })).settings); setMsg('Settings saved — live for new orders'); } catch (x) { setErr(x.message); } };
  const N = (k, label, hint) => <div className="field"><label>{label}</label><input type="number" min="0" step="any" value={s[k] ?? ''} onChange={set(k)} />{hint && <div className="muted" style={{ marginTop: 4 }}>{hint}</div>}</div>;
  return (<form onSubmit={save}><PageHead title="Platform settings" sub="Delivery pricing, free delivery, taxes and extra charges. Changes apply to new orders immediately."><button className="btn">Save changes</button></PageHead>
    {err && <div className="err">{err}</div>}{msg && <div className="pill ok" style={{ marginBottom: 14 }}>{msg}</div>}
    <div className="col">
      <div className="card"><div className="ch"><h3>Delivery</h3></div>
        <div className="row" style={{ marginBottom: 8 }}><div className="grow"><b>Free delivery</b><div className="muted">Waive the delivery fee when the item total reaches the amount below. The platform absorbs the rider cost.</div></div><Toggle on={!!s.freeDeliveryEnabled} onChange={(v) => setS({ ...s, freeDeliveryEnabled: v })} /></div>
        <div className="fg">{N('freeDeliveryAbove', 'Free delivery above (₹)', 'Based on item total before tax')}{N('deliveryBaseFee', 'Base delivery fee (₹)')}{N('deliveryPerKm', 'Fee per km (₹)')}{N('maxDeliveryKm', 'Max delivery distance (km)')}{N('riderSharePct', 'Rider share of delivery fee (%)', 'Paid to riders even when delivery is free')}</div></div>
      <div className="card"><div className="ch"><h3>Taxes & fees</h3></div><div className="fg">{N('taxPct', 'Tax / GST on items (%)')}{N('platformFee', 'Platform fee per order (₹)', 'Charged to every customer')}{N('defaultCommissionPct', 'Default restaurant commission (%)', 'Used when a restaurant has no custom rate')}</div></div>
      <div className="card"><div className="ch"><h3>Extra charges</h3><button type="button" className="btn line sm" onClick={() => setS({ ...s, extraCharges: [...(s.extraCharges || []), { name: '', type: 'flat', value: '', active: true }] })}>+ Add charge</button></div>
        <p className="muted" style={{ marginTop: 0 }}>Extra charges you add here appear as separate lines at checkout (e.g. surge, handling, rain fee). Restaurants can add their own charges (like packaging) from their panel.</p>
        {!(s.extraCharges || []).length && <p className="muted">No extra charges.</p>}
        {(s.extraCharges || []).map((c, i) => <div key={i} className="chg"><input placeholder="Charge name" value={c.name} onChange={(e) => ch(i, 'name', e.target.value)} />
          <Select value={c.type} onChange={(e) => ch(i, 'type', e.target.value)}><option value="flat">Flat ₹</option><option value="percent">% of items</option></Select>
          <input type="number" min="0" step="any" placeholder="Value" value={c.value} onChange={(e) => ch(i, 'value', e.target.value)} />
          <span className="row"><Toggle on={c.active !== false} onChange={(v) => ch(i, 'active', v)} /><button type="button" className="btn line sm" onClick={() => setS({ ...s, extraCharges: s.extraCharges.filter((_, j) => j !== i) })}>✕</button></span></div>)}</div>
    </div></form>);
}
