'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  userId: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/me');
      const data = await response.json();
      
      if (data.success && data.userId) {
        setUserId(data.userId);
      } else {
        setUserId(null);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setUserId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setUserId(data.userId);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return { success: false, error: 'Connection error' };
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUserId(null);
    }
  };

  const refreshSession = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{ userId, isLoading, signIn, signOut, refreshSession }}>
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