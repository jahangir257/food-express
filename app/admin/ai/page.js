'use client';
import { useState } from 'react';
import { api } from '@/lib/client';
export default function AI() {
  const [t, setT] = useState(''), [busy, setBusy] = useState(false), [err, setErr] = useState('');
  const go = async () => { setBusy(true); setErr(''); try { setT((await api('/api/ai/insights', { method: 'POST' })).insights); } catch (e) { setErr(e.message); } setBusy(false); };
  return (<div className="card" style={{ maxWidth: 760 }}><h3>Gemini business insights</h3><p className="muted">Analyses the last 7 days of orders and suggests actions for operations, promotions and rider supply.</p>
    <button className="btn" onClick={go} disabled={busy}>{busy ? 'Analysing…' : 'Generate insights'}</button>{err && <div className="err">{err}</div>}<p style={{ whiteSpace: 'pre-wrap', marginTop: 16 }}>{t}</p></div>);
}
