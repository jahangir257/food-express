import { handler, ok, num, str } from '@/lib/api';
import { Settings } from '@/lib/models';
import { getSettings, bustSettings } from '@/lib/settings';
export const dynamic = 'force-dynamic';
export const GET = handler(async () => ok({ settings: await getSettings(true) }), ['admin']);
export const PUT = handler(async (req) => {
  const b = await req.json(), n = (k, min, max) => Math.min(max, Math.max(min, num(b[k], k)));
  const doc = { freeDeliveryEnabled: !!b.freeDeliveryEnabled, freeDeliveryAbove: n('freeDeliveryAbove', 0, 100000), deliveryBaseFee: n('deliveryBaseFee', 0, 1000), deliveryPerKm: n('deliveryPerKm', 0, 200),
    maxDeliveryKm: n('maxDeliveryKm', 1, 50), riderSharePct: n('riderSharePct', 0, 100), taxPct: n('taxPct', 0, 40), platformFee: n('platformFee', 0, 500), defaultCommissionPct: n('defaultCommissionPct', 0, 60),
    extraCharges: (Array.isArray(b.extraCharges) ? b.extraCharges : []).slice(0, 10).filter((c) => str(c.name, 40)).map((c) => ({ name: str(c.name, 40), type: c.type === 'percent' ? 'percent' : 'flat', value: Math.max(0, Number(c.value) || 0), active: c.active !== false })) };
  await Settings.findOneAndUpdate({ key: 'main' }, { $set: doc }, { upsert: true });
  bustSettings();
  return ok({ settings: await getSettings(true) });
}, ['admin']);
