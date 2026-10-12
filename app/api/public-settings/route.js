import { handler, ok } from '@/lib/api';
import { getSettings } from '@/lib/settings';
export const dynamic = 'force-dynamic';
export const GET = handler(async () => { const s = await getSettings(); return ok({ freeDeliveryEnabled: s.freeDeliveryEnabled, freeDeliveryAbove: s.freeDeliveryAbove, taxPct: s.taxPct }); });
