'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserDto, Role } from '@unideliver/shared';
import { adminAuthApi } from '../lib/api';
import { useRouter } from 'next/navigation';

interface AdminAuthContextType {
  adminUser: UserDto | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  loginWithDevToken: (email?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_TOKEN_KEY = 'unideliver_admin_token';

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<UserDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const clearError = useCallback(() => setError(null), []);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
    setAdminUser(null);
    setError(null);
    router.replace('/login');
  }, [router]);

  // Restore session on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const savedToken = localStorage.getItem(ADMIN_TOKEN_KEY);
        if (savedToken) {
          setToken(savedToken);
          const { user } = await adminAuthApi.getMe(savedToken);

          // Section 6: if role !== 'admin', sign out immediately and show Access denied
          if (user.role !== Role.ADMIN) {
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            setToken(null);
            setAdminUser(null);
            setError('Access denied: Administrator privileges required.');
          } else {
            setAdminUser(user);
          }
        }
      } catch (err) {
        console.warn('[AdminAuth] Session expired or invalid');
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setToken(null);
        setAdminUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  /**
   * Login with email and password
   */
  const login = useCallback(async (email: string, pass: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // In live environment with Firebase client:
      // const cred = await signInWithEmailAndPassword(auth, email, pass);
      // const idToken = await cred.user.getIdToken();
      // For local development fallback when Firebase credentials are not yet configured:
      const devToken = `dev:admin-uid:+94770000001:admin`;
      
      // Establish session with backend
      const { user } = await adminAuthApi.session(devToken);

      // Section 6 Check: If role !== 'admin', sign out and show Access denied
      if (user.role !== Role.ADMIN) {
        setError('Access denied: Administrator privileges required.');
        throw new Error('Access denied: Administrator privileges required.');
      }

      localStorage.setItem(ADMIN_TOKEN_KEY, devToken);
      setToken(devToken);
      setAdminUser(user);
      router.replace('/');
    } catch (err: any) {
      const msg = err?.message || 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  /**
   * Fast dev login
   */
  const loginWithDevToken = useCallback(async (email = 'admin@unideliver.lk'): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const devToken = `dev:admin-uid:+94770000001:admin`;
      const { user } = await adminAuthApi.session(devToken);

      if (user.role !== Role.ADMIN) {
        setError('Access denied: Administrator privileges required.');
        return;
      }

      localStorage.setItem(ADMIN_TOKEN_KEY, devToken);
      setToken(devToken);
      setAdminUser(user);
      router.replace('/');
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        token,
        isLoading,
        error,
        login,
        loginWithDevToken,
        logout,
        clearError,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
