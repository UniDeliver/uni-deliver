import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserDto, Role, AccountStatus } from '@unideliver/shared';
import { authApi } from '../../api/auth.api';
import { setAuthTokenProvider, setOnUnauthorized } from '../../api/client';
import { Platform } from 'react-native';

interface AuthContextType {
  user: UserDto | null;
  idToken: string | null;
  isLoading: boolean;
  error: string | null;
  signInWithDevToken: (uid: string, phone: string, role?: Role, name?: string) => Promise<UserDto>;
  sendPhoneOtp: (phoneNumber: string) => Promise<{ verificationId: string }>;
  confirmPhoneOtp: (verificationId: string, code: string, phone?: string) => Promise<UserDto>;
  completeProfile: (name: string, email?: string) => Promise<UserDto>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<UserDto | null>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_TOKEN = 'unideliver_auth_token';

// Simple cross-platform storage helper
const storage = {
  getItem: (key: string): string | null => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return (globalThis as any)[key] || null;
  },
  setItem: (key: string, value: string): void => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    (globalThis as any)[key] = value;
  },
  removeItem: (key: string): void => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    delete (globalThis as any)[key];
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Configure token provider for API client
  useEffect(() => {
    setAuthTokenProvider(async () => {
      return idToken || storage.getItem(STORAGE_KEY_TOKEN);
    });

    setOnUnauthorized(() => {
      console.warn('[AuthProvider] 401 Unauthorized received, signing out...');
      signOut();
    });
  }, [idToken]);

  // Load existing session on start (Section 5.3)
  useEffect(() => {
    async function loadSession() {
      try {
        const savedToken = storage.getItem(STORAGE_KEY_TOKEN);
        if (savedToken) {
          setIdToken(savedToken);
          // Call GET /api/v1/auth/me to verify user & load authoritative role from server
          const response = await authApi.getMe();
          setUser(response.user);
        }
      } catch (err: any) {
        console.warn('[AuthProvider] Failed to restore session:', err?.message || err);
        storage.removeItem(STORAGE_KEY_TOKEN);
        setIdToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const refreshUser = useCallback(async (): Promise<UserDto | null> => {
    try {
      const response = await authApi.getMe();
      setUser(response.user);
      return response.user;
    } catch (err: any) {
      console.error('[AuthProvider] refreshUser failed:', err);
      return null;
    }
  }, []);

  /**
   * Fast dev sign-in helper for development and testing
   * Creates or links user via dev token
   */
  const signInWithDevToken = useCallback(
    async (uid: string, phone: string, role = Role.CUSTOMER, name?: string): Promise<UserDto> => {
      setIsLoading(true);
      setError(null);
      try {
        const token = `dev:${uid}:${phone}:${role}`;
        storage.setItem(STORAGE_KEY_TOKEN, token);
        setIdToken(token);

        const response = await authApi.session(token);
        let currentUser = response.user;

        // If a name was passed and profile is incomplete, automatically update
        if (name && !currentUser.profileComplete) {
          const updated = await authApi.updateMe({ name });
          currentUser = updated.user;
        }

        setUser(currentUser);
        return currentUser;
      } catch (err: any) {
        const msg = err?.message || 'Dev sign in failed';
        setError(msg);
        storage.removeItem(STORAGE_KEY_TOKEN);
        setIdToken(null);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Send Phone OTP
   */
  const sendPhoneOtp = useCallback(async (phoneNumber: string): Promise<{ verificationId: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      // In mobile app, phone OTP is backed by Firebase Auth
      // Returns a verification ID
      const verificationId = `v_${Date.now()}_${phoneNumber.replace(/\+/g, '')}`;
      return { verificationId };
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Confirm Phone OTP and authenticate with backend POST /api/v1/auth/session
   */
  const confirmPhoneOtp = useCallback(
    async (verificationId: string, code: string, phone = '+94771234567'): Promise<UserDto> => {
      setIsLoading(true);
      setError(null);
      try {
        // Construct token (in live Firebase, this is the Firebase ID token obtained from user credential)
        const token = `dev:${verificationId}:${phone}`;
        storage.setItem(STORAGE_KEY_TOKEN, token);
        setIdToken(token);

        const response = await authApi.session(token);
        setUser(response.user);
        return response.user;
      } catch (err: any) {
        setError(err?.message || 'Invalid OTP code');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Complete customer profile with name and optional email
   */
  const completeProfile = useCallback(async (name: string, email?: string): Promise<UserDto> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.updateMe({ name, email });
      setUser(response.user);
      return response.user;
    } catch (err: any) {
      setError(err?.message || 'Failed to complete profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout (Section 5.5, SR07): Clear session, reset storage, clear state
   */
  const signOut = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      storage.removeItem(STORAGE_KEY_TOKEN);
      setIdToken(null);
      setUser(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        isLoading,
        error,
        signInWithDevToken,
        sendPhoneOtp,
        confirmPhoneOtp,
        completeProfile,
        signOut,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
