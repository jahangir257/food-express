'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useApp } from './Providers';
import { Icon } from './ui';
export default function DashShell({ brand, links, profileHref, children }) {
  const path = usePathname(), { user, setUser } = useApp(), [open, setOpen] = useState(false);
  const active = (l, i) => (i === 0 ? path === l.href : path.startsWith(l.href));
  const cur = links.find(active) || links[0];
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); try { localStorage.removeItem('carts'); } catch {} setUser(null); location.href = '/login'; };
  return (<div className="dash"><div className={'scrim' + (open ? ' on' : '')} onClick={() => setOpen(false)} />
    <aside className={'side' + (open ? ' open' : '')} onClick={() => setOpen(false)}>
      <div className="brand">foodie<b>express</b><small>{brand}</small></div>
      <nav>{links.map((l, i) => <Link key={l.href} href={l.href} className={active(l, i) ? 'on' : ''}><Icon n={l.icon} s={19} />{l.label}{l.badge ? <span className="bd">{l.badge}</span> : null}</Link>)}{profileHref && <Link href={profileHref} className={path === profileHref ? 'on' : ''}><Icon n="profile" s={19} />My profile</Link>}</nav>
      <button className="lo" onClick={logout}><Icon n="logout" s={19} />Logout</button>
    </aside>
    <div className="dmain"><header className="dtop"><button className="burger" onClick={() => setOpen(!open)}aria-label="Menu"><Icon n="menu" s={24} /></button><h2>{cur?.label}</h2>{profileHref ? <Link href={profileHref} className="tuser"><span className="av">{user?.name?.[0]?.toUpperCase()}</span><span className="tn">{user?.name}</span></Link> : <span className="muted">{user?.name}</span>}</header><div className="dbody">{children}</div></div>
  </div>);
}
