'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/components/Providers';
import { UserCog, MapPinHouse, Heart, ShoppingBag, LogOut } from 'lucide-react';
const links = [['/profile', 'My profile', UserCog], ['/profile/addresses', 'Saved addresses', MapPinHouse], ['/profile/favorites', 'Favourite restaurants', Heart], ['/orders', 'My orders', ShoppingBag]];
export default function ProfileLayout({ children }) {
  const p = usePathname(), { user, setUser, favs, addresses } = useApp();
  const sub = { '/profile': 'Name, phone & email', '/profile/addresses': addresses.length ? `${addresses.length} saved` : 'Add an address', '/profile/favorites': favs.length ? `${favs.length} saved` : 'None yet', '/orders': 'Track & reorder' };
  const out = async () => { await fetch('/api/auth/logout', { method: 'POST' }); try { localStorage.removeItem('carts'); } catch {} setUser(null); location.href = '/login'; };
  return (<div className="container pfl">
    <aside className="pside"><div className="pu"><span className="av big">{user?.name?.[0]?.toUpperCase()}</span><div className="grow"><b>{user?.name}</b><div className="muted ell">{user?.email}</div></div></div>
      <nav>{links.map(([h, l, I]) => <Link key={h} href={h} className={p === h ? 'on' : ''}><span className="pic"><I size={20} /></span><span className="pt"><span className="pl">{l}</span><small className="psub">{sub[h]}</small></span>{h === '/profile/favorites' && favs.length > 0 && <em>{favs.length}</em>}{h === '/profile/addresses' && addresses.length > 0 && <em>{addresses.length}</em>}</Link>)}
        <button className="plo" onClick={out}><span className="pic"><LogOut size={20} /></span><span className="pt"><span className="pl">Log out</span></span></button></nav></aside>
    <section className="pmain">{children}</section></div>);
}
