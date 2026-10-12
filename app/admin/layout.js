'use client';
import { useState } from 'react';
import DashShell from '@/components/DashShell';
import { api } from '@/lib/client';
import { usePoll } from '@/lib/hooks';
export default function Layout({ children }) {
  const [s, setS] = useState({});
  usePoll(() => api('/api/admin/stats').then(setS).catch(() => {}), 20000);
  return <DashShell profileHref="/admin/profile" brand="Admin" links={[
    { href: '/admin', label: 'Overview', icon: 'chart' }, { href: '/admin/orders', label: 'Orders', icon: 'bag', badge: s.unassigned },
    { href: '/admin/restaurants', label: 'Restaurants', icon: 'store', badge: s.pendingRestaurants }, { href: '/admin/riders', label: 'Riders', icon: 'bike', badge: s.pendingRiders },
    { href: '/admin/customers', label: 'Customers', icon: 'users' }, { href: '/admin/categories', label: 'Categories', icon: 'grid' },
    { href: '/admin/coupons', label: 'Coupons', icon: 'gift' }, { href: '/admin/settings', label: 'Charges & delivery', icon: 'cog' },
    { href: '/admin/payouts', label: 'Payouts', icon: 'rupee' }, { href: '/admin/ai', label: 'AI insights', icon: 'spark' }]}>{children}</DashShell>;
}
