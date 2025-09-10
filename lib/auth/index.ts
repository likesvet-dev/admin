// lib/auth/index.ts
import { verifyToken } from './tokens';
import prismadb from '@/lib/prismadb';
import { authConfig } from './config';
import { NextRequest } from 'next/server';

// Tipo per la request che può essere di diversi tipi
type AuthRequest = NextRequest | Request | { headers: { get: (name: string) => string | null } };

export async function auth(request?: AuthRequest): Promise<{ userId: string }> {
  let accessToken: string | undefined;

  // Determina il contesto e recupera il token appropriatamente
  if (request && 'headers' in request && typeof request.headers.get === 'function') {
    // Context: API Route, Middleware, o Route Handler
    const cookieHeader = request.headers.get('cookie') || '';
    accessToken = parseCookies(cookieHeader)[authConfig.accessTokenCookieName];
  } else {
    // Context: Server Component
    try {
      // Import dinamico per evitare errori in edge runtime
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      accessToken = cookieStore.get(authConfig.accessTokenCookieName)?.value;
    } catch (error) {
      console.error('Auth context error:', error);
      throw new Error('Authentication not available in this context. Use auth(request) for API routes.');
    }
  }

  // Resto della logica di verifica
  if (!accessToken) {
    throw new Error('Non autenticato');
  }
  
  const payload = verifyToken(accessToken);
  
  if (!payload) {
    throw new Error('Token non valido');
  }
  
  const user = await prismadb.admin.findUnique({
    where: { id: payload.userId },
    select: { id: true, tokenVersion: true },
  });
  
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    throw new Error('Token revocato');
  }
  
  return { userId: payload.userId };
}

function parseCookies(cookieString: string): Record<string, string> {
  if (!cookieString) return {};
  
  return cookieString.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.split('=').map(c => c.trim());
    if (name) {
      cookies[name] = decodeURIComponent(value || '');
    }
    return cookies;
  }, {} as Record<string, string>);
}

// Helper function per uso specifico in API routes
export async function authApi(request: AuthRequest) {
  return auth(request);
}

// Helper function per uso specifico in Server Components
export async function authServer() {
  return auth();
}