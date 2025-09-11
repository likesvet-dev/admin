'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

interface AuthContextType {
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const bcRef = useRef<BroadcastChannel | null>(null);

  const pendingCheckRef = useRef<Promise<{ userId: string | null; email: string | null } | null> | null>(null);

  const checkAuth = useCallback(async (): Promise<{ userId: string | null; email: string | null } | null> => {
    if (pendingCheckRef.current) {
      return pendingCheckRef.current;
    }

    const p = (async () => {
      setIsLoading(true);
      try {
        const { userId, email } = await auth();
        setUserId(userId);
        setEmail(email ?? null);
        setIsAuthenticated(!!userId);
        return { userId, email: email ?? null };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setUserId(null);
        setEmail(null);
        setIsAuthenticated(false);
        return null;
      } finally {
        setIsLoading(false);
        pendingCheckRef.current = null;
      }
    })();

    pendingCheckRef.current = p;
    return p;
  }, []);

  // --- BroadcastChannel multi-tab ---
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bcRef.current = new BroadcastChannel('auth');
      bcRef.current.onmessage = (ev) => {
        if (ev.data === 'signIn' || ev.data === 'refresh') {
          if (!pendingCheckRef.current) checkAuth();
        } else if (ev.data === 'signOut') {
          setUserId(null);
          setEmail(null);
          setIsAuthenticated(false);
          localStorage.setItem('passwordAuthorized', 'false');
          if (typeof window !== 'undefined' && window.location.pathname !== '/sign-in') {
            router.push('/sign-in');
          }
        }
      };
    }

    // initial check (deduped)
    checkAuth();

    return () => {
      try { bcRef.current?.close(); } catch { }
    };
  }, [checkAuth, router]);

  // --- login ---
  const signIn = async (emailArg: string, password: string) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailArg, password }),
      });

      const data = await res.json().catch(() => null);
      if (data?.success) {
        // reuse pending check if any, otherwise start a new one
        await checkAuth();
        try { bcRef.current?.postMessage('signIn'); } catch { }
        localStorage.setItem('passwordAuthorized', 'true');
        router.push('/');
        return { success: true };
      }

      return { success: false, error: data?.error || 'Errore login' };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      return { success: false, error: 'Connection error' };
    }
  };

  // --- logout ---
  const signOut = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('[AuthProvider] signOut error', err);
    } finally {
      setUserId(null);
      setEmail(null);
      setIsAuthenticated(false);
      localStorage.setItem('passwordAuthorized', 'false');
      try { bcRef.current?.postMessage('signOut'); } catch { }
      if (typeof window !== 'undefined' && window.location.pathname !== '/sign-in') {
        router.push('/sign-in');
      }
    }
  };

  // --- refresh session ---
  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => null);

      if (data?.success) {
        await checkAuth();
        try { bcRef.current?.postMessage('refresh'); } catch { }
      } else {
        await signOut();
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      await signOut();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkAuth]);

  // --- refresh automatico ogni 10 minuti ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated) refreshSession();
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshSession]);

  return (
    <AuthContext.Provider
      value={{
        userId,
        email,
        isAuthenticated,
        isLoading,
        signIn,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}