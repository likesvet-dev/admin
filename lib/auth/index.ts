// lib/auth.ts
import prismadb from '@/lib/prismadb';
import { verifyToken } from './tokens';
import { authConfig } from './config';
import { NextRequest } from 'next/server';

export type AuthRequest = NextRequest | Request | { headers: { get(name: string): string | null } };

// --- parsing cookie ---
function parseCookies(cookieString: string): Record<string, string> {
  if (!cookieString) return {};
  return cookieString.split(';').reduce((cookies, cookie) => {
    const idx = cookie.indexOf('=');
    if (idx === -1) return cookies;
    const name = cookie.slice(0, idx).trim();
    const value = cookie.slice(idx + 1).trim();
    if (name) cookies[name] = decodeURIComponent(value || '');
    return cookies;
  }, {} as Record<string, string>);
}

// --- server-side auth ---
export async function authServer(request?: AuthRequest): Promise<{ userId: string }> {
  let accessToken: string | undefined;

  if (request && 'headers' in request && typeof request.headers.get === 'function') {
    const cookieHeader = request.headers.get('cookie') || '';
    console.log('[authServer] cookieHeader:', cookieHeader);
    accessToken = parseCookies(cookieHeader)[authConfig.accessTokenCookieName];
  } else {
    try {
      const { cookies } = await import('next/headers');
      const cookieVal = (await cookies()).get(authConfig.accessTokenCookieName);
      console.log('[authServer] cookies():', cookieVal?.value);
      accessToken = cookieVal?.value;
    } catch (err) {
      console.error('[authServer] error accessing cookies:', err);
      throw new Error('Authentication not available in this context.');
    }
  }

  if (!accessToken) {
    console.warn('[authServer] No access token found');
    throw new Error('Non autenticato');
  }

  const payload = verifyToken(accessToken);
  if (!payload) {
    console.warn('[authServer] Token non valido');
    throw new Error('Token non valido');
  }

  const user = await prismadb.admin.findUnique({
    where: { id: payload.userId },
    select: { id: true, tokenVersion: true },
  });

  if (!user || user.tokenVersion !== payload.tokenVersion) {
    console.warn('[authServer] Token revocato o user non trovato');
    throw new Error('Token revocato');
  }

  console.log('[authServer] authenticated userId:', payload.userId);
  return { userId: payload.userId };
}

// --- client-side auth ---
export async function authClient(): Promise<{ userId: string }> {
  try {
    const res = await fetch('/api/admin/me', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      // server returned 401/403 ecc.
      console.warn('[authClient] /api/admin/me not ok, status=', res.status);
      throw new Error('Non autenticato');
    }

    // protezione contro risposte non-JSON
    const data = await res.json().catch(() => null);
    if (data && data.success && data.userId) {
      return { userId: data.userId };
    }

    console.warn('[authClient] /api/admin/me returned unexpected body', data);
    throw new Error('Non autenticato');
  } catch (err) {
    console.error('[authClient] fetch /api/admin/me failed:', err);
    throw new Error('Non autenticato');
  }
}

// --- unificata ---
export async function auth(request?: AuthRequest) {
  if (typeof window === 'undefined') {
    return authServer(request);
  } else {
    return authClient();
  }
}

// --- helpers separati se serve ---
export async function authServerOnly(request?: AuthRequest) {
  return authServer(request);
}
export async function authApi(request: AuthRequest) {
  return authServer(request);
}