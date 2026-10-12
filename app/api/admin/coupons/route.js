import { handler, ok } from '@/lib/api';
import { Coupon } from '@/lib/models';
import { saveCoupon } from '@/lib/couponApi';
export const dynamic = 'force-dynamic';
export const GET = handler(async () => ok({ coupons: await Coupon.find().sort('-createdAt').populate('restaurant', 'name').lean() }), ['admin']);
export const POST = handler(async (req) => ok({ coupon: await saveCoupon(await req.json(), { scope: 'platform' }, { scope: 'platform' }) }, 201), ['admin']);
export const PUT = handler(async (req) => ok({ coupon: await saveCoupon(await req.json(), {}, {}) }), ['admin']);
export const DELETE = handler(async (req) => { await Coupon.deleteOne({ _id: new URL(req.url).searchParams.get('id') }); return ok({ deleted: true }); }, ['admin']);
