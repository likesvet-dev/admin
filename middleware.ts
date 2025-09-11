import { NextResponse, NextRequest } from 'next/server';
import { authConfig } from './lib/auth/config';

const PUBLIC_ROUTES = [
  /^\/api\/.*/,
  /^\/sign-in(\?.*)?$/,
  /^\/sign-up(\?.*)?$/,
];

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://like-svet-site.vercel.app',
  'http://like-svet-site.vercel.app',
  'https://likesvet.com',
  'http://likesvet.com',
  'https://www.likesvet.com',
  'http://www.likesvet.com',
  'https://admin.likesvet.com',
  'http://admin.likesvet.com'
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get('origin') || '';

  // --- bypass route pubbliche ---
  if (PUBLIC_ROUTES.some((pattern) => pattern.test(pathname))) {
    return NextResponse.next();
  }

  // --- log debug cookie ---
  const accessToken = req.cookies.get(authConfig.accessTokenCookieName)?.value;

  // --- redirect login se non c’è cookie ---
  if (!accessToken) {
    const loginUrl = new URL('/sign-in', req.url);
    loginUrl.searchParams.set('redirect', pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // --- CORS headers solo se origin valido ---
  const res = NextResponse.next();
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept'
    );
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Vary', 'Origin');
  }

  // --- preflight OPTIONS ---
  if (req.method === 'OPTIONS') {
    const preflight = new NextResponse(null, { status: 204 });
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      preflight.headers.set('Access-Control-Allow-Origin', origin);
      preflight.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
      preflight.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With, Accept'
      );
      preflight.headers.set('Access-Control-Allow-Credentials', 'true');
      preflight.headers.set('Vary', 'Origin');
    }
    return preflight;
  }

  return res;
}

// --- matcher: tutto tranne _next e file statici ---
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
