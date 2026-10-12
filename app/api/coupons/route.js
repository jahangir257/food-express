import mongoose from 'mongoose';
import { handler, ok } from '@/lib/api';
import { Coupon } from '@/lib/models';
export const dynamic = 'force-dynamic';
export const GET = handler(async (req) => {
  const rid = new URL(req.url).searchParams.get('restaurantId'), now = new Date();
  const q = { active: true, $and: [{ $or: [{ validTo: null }, { validTo: { $gte: now } }] }, { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] }] };
  if (rid && mongoose.isValidObjectId(rid)) q.$or = [{ scope: 'platform' }, { scope: 'restaurant', restaurant: rid }];
  const list = await Coupon.find(q).sort('-createdAt').limit(40).populate('restaurant', 'name').select('code description type value maxDiscount minOrder scope restaurant usageLimit usedCount firstOrderOnly validTo').lean();
  return ok({ coupons: list.filter((c) => !c.usageLimit || c.usedCount < c.usageLimit) });
});
