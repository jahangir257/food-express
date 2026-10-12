'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { Toggle } from '@/components/ui';
export default function Riders() {
  const [rs, setRs] = useState(null);
  const load = () => api('/api/admin/riders').then((d) => setRs(d.riders));
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);
  const set = async (id, approved) => { await api('/api/admin/riders', { method: 'PATCH', body: { id, approved } }); load(); };
  return (<div className="card tblw"><table className="tbl"><thead><tr><th>Rider</th><th>Contact</th><th>Vehicle</th><th>Status</th><th>Approved</th></tr></thead><tbody>
    {!rs ? <tr><td colSpan="5" className="muted">Loading…</td></tr> : rs.map((r) => <tr key={r._id}><td>{r.name}</td><td>{r.email}<div className="muted">{r.phone}</div></td><td>{r.rider?.vehicle || '—'}</td>
      <td>{!r.approved ? <span className="pill">Pending</span> : r.rider?.online ? <span className={'pill ' + (r.rider.busy ? 'p' : 'dark')}>{r.rider.busy ? 'On delivery' : 'Online'}</span> : <span className="pill">Offline</span>}</td>
      <td><Toggle on={r.approved} onChange={(v) => set(r._id, v)} /></td></tr>)}</tbody></table></div>);
}
