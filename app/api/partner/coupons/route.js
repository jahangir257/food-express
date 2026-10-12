import { handler, ok } from '@/lib/api';
import { Coupon } from '@/lib/models';
import { saveCoupon } from '@/lib/couponApi';
export const dynamic = 'force-dynamic';
export const GET = handler(async (_r, { user }) => ok({ coupons: await Coupon.find({ scope: 'restaurant', restaurant: user.restaurant }).sort('-createdAt').lean() }), ['restaurant']);
export const POST = handler(async (req, { user }) => ok({ coupon: await saveCoupon(await req.json(), { scope: 'restaurant', restaurant: user.restaurant }, {}) }, 201), ['restaurant']);
export const PUT = handler(async (req, { user }) => ok({ coupon: await saveCoupon(await req.json(), { scope: 'restaurant', restaurant: user.restaurant }, { scope: 'restaurant', restaurant: user.restaurant }) }), ['restaurant']);
export const DELETE = handler(async (req, { user }) => { await Coupon.deleteOne({ _id: new URL(req.url).searchParams.get('id'), scope: 'restaurant', restaurant: user.restaurant }); return ok({ deleted: true }); }, ['restaurant']);
