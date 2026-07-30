import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: '/',
};

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Respect manual overrides (?v=studio) and existing assignments.
  const hasOverride = !!req.nextUrl.searchParams.get('v');
  const hasCookie = !!req.cookies.get('ab_design');

  if (!hasOverride && !hasCookie) {
    const variant = Math.random() < 0.5 ? 'editorial' : 'studio';
    res.cookies.set('ab_design', variant, {
      maxAge: 60 * 60 * 24 * 30, // 30 days — same visitor always sees the same design
      path: '/',
      sameSite: 'lax',
    });
  }

  return res;
}
