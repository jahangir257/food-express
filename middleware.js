import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
const guard = { '/admin': 'admin', '/partner': 'restaurant', '/rider': 'rider', '/orders': '*', '/profile': '*' };
export async function middleware(req) {
  const p = req.nextUrl.pathname;
  const need = guard['/' + p.split('/')[1]];
  if (!need) return NextResponse.next();
  try {
    const { payload } = await jwtVerify(req.cookies.get('token')?.value || '', new TextEncoder().encode(process.env.AUTH_SECRET || ''));
    if (need === '*' || payload.role === need) return NextResponse.next();
    return NextResponse.redirect(new URL('/', req.url));
  } catch { return NextResponse.redirect(new URL('/login?next=' + encodeURIComponent(p), req.url)); }
}
export const config = { matcher: ['/admin/:path*', '/partner/:path*', '/rider/:path*', '/orders/:path*', '/profile/:path*'] };
