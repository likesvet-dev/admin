/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { useRouter } from 'next/navigation';

interface AuthUser {
    adminId: string;
    email: string;
}

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (accessToken: string, redirectTo?: string) => Promise<void>;
    logout: () => void;
    refreshAccessToken: () => Promise<string | null>;
    apiFetch: <T = any>(
        url: string,
        options?: RequestInit
    ) => Promise<{ ok: boolean; status: number; data?: T; error?: any }>;
}

interface DecodedToken extends JwtPayload {
    adminId: string;
    email: string;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    loading: true,
    login: async () => { },
    logout: () => { },
    refreshAccessToken: async () => null,
    apiFetch: async () => ({ ok: false, status: 500, error: 'Not implemented' }),
});

const CMS_COOKIE_DOMAIN = process.env.NODE_ENV === 'production' ? 'admin.likesvet.com' : 'localhost';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // --- BroadcastChannel per multi-tab sync ---
    const bc = new BroadcastChannel('auth_channel');

    bc.onmessage = (e) => {
        if (e.data.type === 'TOKEN_REFRESH') {
            try {
                const decoded = jwtDecode<DecodedToken>(e.data.token);
                setUser({ adminId: decoded.adminId, email: decoded.email });
                localStorage.setItem('cms_jwt_token', e.data.token);
            } catch {
                setUser(null);
            }
        } else if (e.data.type === 'LOGOUT') {
            setUser(null);
            localStorage.removeItem('cms_jwt_token');
        }
    };

    // --- Logout ---
    const logout = useCallback(async () => {
        try {
            await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
        } catch (err) {
            console.error('Logout failed', err);
        }
        localStorage.removeItem('cms_jwt_token');
        localStorage.removeItem('cms_jwt_token_updated');
        localStorage.setItem('passwordAuthorized', 'false');
        document.cookie = `cms_jwt_token=; path=/; domain=${CMS_COOKIE_DOMAIN}; max-age=0; samesite=strict`;
        document.cookie = `cms_refresh_token=; path=/; domain=${CMS_COOKIE_DOMAIN}; max-age=0; samesite=strict`;
        setUser(null);
        bc.postMessage({ type: 'LOGOUT' });
        window.location.href = '/sign-in';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Refresh access token ---
    const refreshAccessToken = useCallback(async (): Promise<string | null> => {
        const refreshingKey = 'cms_jwt_refreshing';

        if (localStorage.getItem(refreshingKey) === 'true') {
            return new Promise((resolve) => {
                const handleStorage = (e: StorageEvent) => {
                    if (e.key === 'cms_jwt_token' && e.newValue) {
                        window.removeEventListener('storage', handleStorage);
                        resolve(e.newValue);
                    }
                };
                window.addEventListener('storage', handleStorage);
            });
        }

        try {
            localStorage.setItem(refreshingKey, 'true');
            const res = await fetch('/api/admin/refresh', { method: 'POST', credentials: 'include' });
            if (!res.ok) {
                localStorage.removeItem(refreshingKey);
                return null;
            }

            const data = await res.json();
            const newAccessToken: string = data.accessToken;

            localStorage.setItem('cms_jwt_token', newAccessToken);
            document.cookie = `cms_jwt_token=${newAccessToken}; path=/; domain=${CMS_COOKIE_DOMAIN}; max-age=${15 * 60}; samesite=strict; secure=${process.env.NODE_ENV === 'production'}`;

            setUser(jwtDecode<DecodedToken>(newAccessToken));
            localStorage.removeItem(refreshingKey);
            localStorage.setItem('cms_jwt_token_updated', Date.now().toString());

            // Notifica altri tab
            bc.postMessage({ type: 'TOKEN_REFRESH', token: newAccessToken });

            return newAccessToken;
        } catch (err) {
            console.error('Token refresh failed', err);
            localStorage.removeItem(refreshingKey);
            setUser(null);
            return null;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- API fetch protetta con retry automatico ---
    const apiFetch = useCallback(
        async <T = any>(url: string, options: RequestInit = {}): Promise<{ ok: boolean; status: number; data?: T; error?: any }> => {
            const accessToken = localStorage.getItem('cms_jwt_token');
            if (!accessToken) return { ok: false, status: 401, error: 'No token' };

            const makeRequest = async (token: string) => {
                const res = await fetch(url, {
                    ...options,
                    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
                    credentials: 'include',
                });
                const contentType = res.headers.get('content-type');
                const data = contentType?.includes('application/json') ? await res.json() : await res.text();
                return { ok: res.ok, status: res.status, data: res.ok ? (data as T) : undefined, error: res.ok ? null : data };
            };

            let response = await makeRequest(accessToken);

            if (response.status === 401) {
                const newToken = await refreshAccessToken();
                if (!newToken) return { ok: false, status: 401, error: 'Token refresh failed' };
                response = await makeRequest(newToken);
            }

            return response;
        },
        [refreshAccessToken]
    );

    // --- Inizializzazione auth ---
    useEffect(() => {
        const initAuth = async () => {
            const accessToken = localStorage.getItem('cms_jwt_token');

            if (!accessToken) {
                setLoading(false);
                return;
            }

            try {
                const decoded = jwtDecode<DecodedToken>(accessToken);
                if (decoded.exp && Date.now() > decoded.exp * 1000) {
                    await refreshAccessToken();
                } else {
                    setUser({ adminId: decoded.adminId, email: decoded.email });
                    if (decoded.exp) {
                        const timeout = decoded.exp * 1000 - Date.now() - 60 * 1000;
                        if (timeout > 0) setTimeout(() => refreshAccessToken(), timeout);
                    }
                }
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'cms_jwt_token' && e.newValue) {
                try {
                    const decoded = jwtDecode<DecodedToken>(e.newValue);
                    setUser({ adminId: decoded.adminId, email: decoded.email });
                } catch {
                    setUser(null);
                }
            } else if (e.key === 'cms_jwt_token' && e.newValue === null) {
                setUser(null);
            } else if (e.key === 'cms_jwt_token_updated') {
                const token = localStorage.getItem('cms_jwt_token');
                if (token) {
                    try {
                        const decoded = jwtDecode<DecodedToken>(token);
                        setUser({ adminId: decoded.adminId, email: decoded.email });
                    } catch {
                        setUser(null);
                    }
                }
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [refreshAccessToken]);

    // --- Login con supporto cookie SSR e redirect ---
    const login = async (accessToken: string, redirectTo?: string) => {
        try {
            const decoded = jwtDecode<DecodedToken>(accessToken);
            localStorage.setItem('cms_jwt_token', accessToken);
            document.cookie = `cms_jwt_token=${accessToken}; path=/; domain=${CMS_COOKIE_DOMAIN}; max-age=${15 * 60}; samesite=strict; secure=${process.env.NODE_ENV === 'production'}`;
            setUser({ adminId: decoded.adminId, email: decoded.email });

            // Notifica altri tab
            bc.postMessage({ type: 'TOKEN_REFRESH', token: accessToken });

            if (redirectTo) {
                router.push(redirectTo);
                return;
            }

            const response = await apiFetch<{ id: string }[]>('/api/stores', { method: 'GET' });
            router.push(response.ok && response.data?.length ? `/${response.data[0].id}` : '/');
        } catch (err) {
            console.error('Login failed', err);
            router.push('/sign-in');
        }
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout, refreshAccessToken, apiFetch }}>
            {children}
        </AuthContext.Provider>
    );
};

// --- Hook simile a useUser di Clerk ---
export const useUser = () => useContext(AuthContext);

// --- Hook per pagine protette ---
export const useWithAuth = () => {
    const { user, isAuthenticated, loading, logout } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
            router.push(`/sign-in?redirect=${redirectUrl}`);
        }
    }, [isAuthenticated, loading, router]);

    return { user, isAuthenticated, loading, logout };
};