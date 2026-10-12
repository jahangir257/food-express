'use client';
import { useEffect, useState } from 'react';
import { api, inr, when } from '@/lib/client';
export default function Customers() {
  const [c, setC] = useState(null);
  useEffect(() => { api('/api/admin/customers').then((d) => setC(d.customers)); }, []);
  return (<div className="card tblw"><table className="tbl"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Orders</th><th>Spent</th></tr></thead><tbody>
    {!c ? <tr><td colSpan="6" className="muted">Loading…</td></tr> : c.map((u) => <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.phone}</td><td>{when(u.createdAt)}</td><td>{u.orders}</td><td>{inr(u.spent)}</td></tr>)}</tbody></table></div>);
}
