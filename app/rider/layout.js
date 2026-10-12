'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/components/Providers';
import { Icon } from '@/components/ui';
export default function Layout({ children }) {
  const p = usePathname(), { user, setUser } = useApp();
  const out = async () => { await fetch('/api/auth/logout', { method: 'POST' }); setUser(null); location.href = '/login'; };
  return (<div className="rapp">
    <div className="rtop"><div className="rider row between"><span className="logo">foodie<b>express</b> <span className="rtag">Rider</span></span>
      <span className="row"><span className="rname">{user?.name}</span><button className="rlo" onClick={out} aria-label="Logout"><Icon n="logout" s={18} /></button></span></div></div>
    <div className="rider">{children}</div>
    <nav className="bnav"><Link href="/rider" className={p === '/rider' ? 'on' : ''}><Icon n="bike" />Deliveries</Link><Link href="/rider/history" className={p.startsWith('/rider/history') ? 'on' : ''}><Icon n="rupee" />Earnings</Link><Link href="/rider/profile" className={p.startsWith('/rider/profile') ? 'on' : ''}><Icon n="profile" />Profile</Link></nav></div>);
}
