import { NextResponse } from 'next/server';

// Gate account pages and checkout behind login (session cookie check;
// the API layer re-verifies the session against the database).
export function middleware(request) {
  const sid = request.cookies.get('sid');
  if (!sid) {
    const url = request.nextUrl.clone();
    const next = url.pathname + (url.search || '');
    url.pathname = '/login';
    url.search = '?next=' + encodeURIComponent(next);
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'no-store, must-revalidate');
  return res;
}

export const config = {
  matcher: ['/account/:path*', '/account', '/checkout'],
};
