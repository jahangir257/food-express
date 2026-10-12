import { ok } from '@/lib/api';
import { clearAuthCookie } from '@/lib/auth';
export const POST = async () => { clearAuthCookie(); return ok({ ok: true }); };
