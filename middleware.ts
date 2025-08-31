import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/api/(.*)',
  '/sign-in(.*)',
]);

const ALLOWED_ORIGINS = [
  'http://localhost:3001',
  'http://localhost:3000',
  'https://like-svet-site.vercel.app',
];

export default clerkMiddleware(async (auth, req) => {
  const origin = req.headers.get('origin');

  // Crea la risposta predefinita
  const res = NextResponse.next();

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS, PATCH');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Risposta preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: res.headers,
    });
  }

  // Protegge le rotte private con Clerk
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  return res;
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};