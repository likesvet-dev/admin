// middleware.ts
import { NextResponse, NextRequest } from 'next/server';
import { verifyToken } from './lib/auth/tokens';
import prismadb from './lib/prismadb';
import { authConfig } from './lib/auth/config'; // Importa la config

// Rotte pubbliche
const PUBLIC_ROUTES = [
  /^\/api\/.*/,
  /^\/sign-in(\?.*)?$/,
  /^\/sign-up(\?.*)?$/,
];

// Origini consentite (CORS)
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

  const res = NextResponse.next();

  // --- CORS headers ---
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept'
    );
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Access-Control-Expose-Headers', 'X-Request-Id, X-Total-Count');
    res.headers.set('Vary', 'Origin');
  }

  // --- Preflight OPTIONS ---
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

  // --- Route pubbliche → bypass auth ---
  if (PUBLIC_ROUTES.some((pattern) => pattern.test(pathname))) {
    if (pathname.includes('/auth')) {
      res.headers.set('Cache-Control', 'no-store');
    }
    return res;
  }

  // --- Route protette: verifica autenticazione ---
  // MODIFICA: Leggi i cookie direttamente dalla request
  const accessToken = req.cookies.get(authConfig.accessTokenCookieName)?.value;
  
  if (!accessToken) {
    const loginUrl = new URL('/sign-in', req.url);
    loginUrl.searchParams.set('redirect', pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }
  
  const payload = verifyToken(accessToken);
  
  if (!payload) {
    const loginUrl = new URL('/sign-in', req.url);
    loginUrl.searchParams.set('redirect', pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }
  
  // Verifica che l'utente esista ancora
  const user = await prismadb.admin.findUnique({
    where: { id: payload.userId },
    select: { id: true, tokenVersion: true },
  });
  
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    const loginUrl = new URL('/sign-in', req.url);
    loginUrl.searchParams.set('redirect', pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // --- Verifica accesso specifico per store ---
  const segments = pathname.split('/').filter(Boolean);
  const storeIdPattern = /^[a-f0-9]{24}$/i;

  if (segments[0] && storeIdPattern.test(segments[0])) {
    const store = await prismadb.store.findFirst({
      where: {
        id: segments[0],
        userId: payload.userId,
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Accesso negato a questa store' },
        { status: 403 }
      );
    }
  }

  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};