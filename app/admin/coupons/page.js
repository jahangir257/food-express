'use client';
import CouponManager from '@/components/CouponManager';
export default function Page() { return <CouponManager endpoint="/api/admin/coupons" showScope />; }
