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
// NOTICE: we dynamically import server-only modules here so this file stays client-safe.
export async function authServer(request?: AuthRequest): Promise<{ userId: string; email: string | null }> {
  // import server modules only when running on the server
  const [{ authConfig }, { verifyToken }, prismadbModule] = await Promise.all([
    import('@/lib/server/auth/config'),
    import('@/lib/server/auth/tokens'),
    import('@/lib/prismadb'),
  ]);

  const prismadb = prismadbModule.default ?? prismadbModule;

  let accessToken: string | undefined;

  if (request && 'headers' in request && typeof request.headers.get === 'function') {
    const cookieHeader = request.headers.get('cookie') || '';
    accessToken = parseCookies(cookieHeader)[authConfig.accessTokenCookieName];
  } else {
    try {
      const { cookies } = await import('next/headers');
      const cookieVal = (await cookies()).get(authConfig.accessTokenCookieName);
      accessToken = cookieVal?.value;
    } catch {
      throw new Error('Authentication not available in this context.');
    }
  }

  if (!accessToken) throw new Error('Not authenticated');

  const payload = verifyToken(accessToken);
  if (!payload) throw new Error('Token not valid');

  const user = await prismadb.admin.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, tokenVersion: true },
  });

  if (!user || user.tokenVersion !== payload.tokenVersion) {
    throw new Error('Token revoked or user not found');
  }

  return { userId: user.id, email: user.email };
}

// --- client-side auth ---
// dedupe: pending promise a livello di modulo
let pendingAuthClient: Promise<{ userId: string; email: string | null }> | null = null;

export async function authClient(): Promise<{ userId: string; email: string | null }> {
  // se una richiesta è già in corso, riusala
  if (pendingAuthClient) {
    return pendingAuthClient;
  }

  pendingAuthClient = (async () => {
    try {
      const res = await fetch('/api/admin/me', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Not authenticated');
      }

      const data = await res.json().catch(() => null);

      if (data?.success && data.userId) {
        return { userId: data.userId, email: data.email || null };
      }

      throw new Error('Not authenticated');
    } finally {
      pendingAuthClient = null;
    }
  })();

  pendingAuthClient
    .then(() => { pendingAuthClient = null; })
    .catch(() => { pendingAuthClient = null; });

  return pendingAuthClient;
}

// --- unified entry ---
export async function auth(request?: AuthRequest): Promise<{ userId: string; email: string | null }> {
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