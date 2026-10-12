import { Settings } from './models';
const e = (k, d) => (process.env[k] !== undefined ? Number(process.env[k]) : d);
export const DEFAULTS = { freeDeliveryEnabled: true, freeDeliveryAbove: 200, deliveryBaseFee: e('DELIVERY_BASE_FEE', 25), deliveryPerKm: e('DELIVERY_PER_KM', 8), maxDeliveryKm: e('MAX_DELIVERY_KM', 15),
  riderSharePct: e('RIDER_SHARE_PCT', 80), taxPct: e('TAX_PCT', 5), platformFee: 5, defaultCommissionPct: e('PLATFORM_COMMISSION_PCT', 15), extraCharges: [] };
let cache = null, at = 0;
export async function getSettings(fresh = false) {
  if (!fresh && cache && Date.now() - at < 10000) return cache;
  const s = await Settings.findOne({ key: 'main' }).lean();
  cache = { ...DEFAULTS, ...(s || {}) }; at = Date.now();
  return cache;
}
export const bustSettings = () => { cache = null; };
