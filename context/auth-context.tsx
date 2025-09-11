// context/auth-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { auth } from '@/lib/auth';

interface AuthContextType {
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const bcRef = useRef<BroadcastChannel | null>(null);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const { userId } = await auth();
      setUserId(userId);
      setIsAuthenticated(true);
    } catch {
      setUserId(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // BroadcastChannel solo nel client e nel useEffect
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bcRef.current = new BroadcastChannel('auth');
      bcRef.current.onmessage = (ev) => {
        if (ev.data === 'signIn' || ev.data === 'refresh') {
          checkAuth();
        } else if (ev.data === 'signOut') {
          setUserId(null);
          setIsAuthenticated(false);
        }
      };
    }

    // iniziale
    checkAuth();

    return () => {
      try { bcRef.current?.close(); } catch {}
    };
  }, [checkAuth]);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => null);
        return { success: false, error: `Server error (${response.status}) ${errBody || ''}` };
      }

      const data = await response.json().catch(() => null);
      if (data && data.success) {
        await checkAuth();
        try { bcRef.current?.postMessage('signIn'); } catch {}
        return { success: true };
      } else {
        return { success: false, error: data?.error || 'Errore autorizzazione' };
      }
    } catch (err) {
      console.error('[signIn] error', err);
      return { success: false, error: 'Connection error' };
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUserId(null);
      setIsAuthenticated(false);
      try { bcRef.current?.postMessage('signOut'); } catch {}
    }
  };

  const refreshSession = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        setUserId(null);
        setIsAuthenticated(false);
        try { bcRef.current?.postMessage('signOut'); } catch {}
        return;
      }

      const data = await response.json().catch(() => null);
      if (data && data.success) {
        await checkAuth();
        try { bcRef.current?.postMessage('refresh'); } catch {}
      } else {
        setUserId(null);
        setIsAuthenticated(false);
        try { bcRef.current?.postMessage('signOut'); } catch {}
      }
    } catch (err) {
      console.error('[refreshSession] error', err);
      setUserId(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ userId, isLoading, isAuthenticated, signIn, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth should be used inside AuthProvider');
  }
  return context;
}