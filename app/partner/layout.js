'use client';
import { useState } from 'react';
import DashShell from '@/components/DashShell';
import { api } from '@/lib/client';
import { usePoll } from '@/lib/hooks';
export default function Layout({ children }) {
  const [n, setN] = useState(0);
  usePoll(() => api('/api/partner/orders').then((d) => setN(d.stats.pending)).catch(() => {}), 15000);
  return <DashShell profileHref="/partner/account" brand="Restaurant partner" links={[
    { href: '/partner', label: 'Dashboard', icon: 'chart' }, { href: '/partner/orders', label: 'Orders', icon: 'bag', badge: n },
    { href: '/partner/menu', label: 'Menu', icon: 'list' }, { href: '/partner/coupons', label: 'Coupons', icon: 'gift' }, { href: '/partner/profile', label: 'Restaurant & charges', icon: 'store' }, { href: '/partner/payouts', label: 'Earnings & bank', icon: 'bank' }]}>{children}</DashShell>;
}
