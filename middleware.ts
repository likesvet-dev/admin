// middleware.ts
import { NextResponse, NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

// Rotte pubbliche (lasciate come prima)
const PUBLIC_ROUTES = [
  /^\/api\/.*/,             // tutte le API pubbliche (come volevi)
  /^\/sign-in(\?.*)?$/,     // login
  /^\/sign-up(\?.*)?$/,     // registrazione
];

// Origini consentite (CORS)
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://like-svet-site.vercel.app',
  'https://likesvet.com',
  'https://www.likesvet.com',
  'https://admin.likesvet.com'
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get('origin') || '';

  const res = NextResponse.next();

  // --- CORS headers (solo per origin whitelistati) ---
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

  // --- Preflight OPTIONS: rispondi subito con 204 e gli stessi header CORS ---
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

  // --- Route pubbliche → bypass auth (manteniamo il comportamento originale) ---
  if (PUBLIC_ROUTES.some((pattern) => pattern.test(pathname))) {
    // se la rotta pubblica è /auth, forziamo no-store per sicurezza
    if (pathname.includes('/auth')) {
      res.headers.set('Cache-Control', 'no-store');
    }
    return res;
  }

  // --- Route protette: solo /[storeId] e sotto-route ---
  const segments = pathname.split('/').filter(Boolean);
  const storeIdPattern = /^[a-f0-9]{24}$/i;

  if (segments[0] && storeIdPattern.test(segments[0])) {
    // getUserFromRequest è async — await la chiamata
    const user = await getUserFromRequest(req);

    if (!user) {
      const loginUrl = new URL('/sign-in', req.url);
      loginUrl.searchParams.set('redirect', pathname + req.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    // proteggi dalla cache delle risposte per richieste autenticate sensibili
    res.headers.set('Cache-Control', 'no-store');
  }

  return res;
}

// matcher: tutte le route tranne _next e asset statici
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};