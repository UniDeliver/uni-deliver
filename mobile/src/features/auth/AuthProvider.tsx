import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AuthTokenResponse,
  ForgotPasswordResponse,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UserDto,
} from '@unideliver/shared';
import { authApi } from '@/api/auth.api';
import { setAuthTokenProvider, setOnUnauthorized } from '@/api/client';
import { tokenStorage } from '@/lib/token-storage';

interface AuthContextType {
  /** Authoritative user from the server. Routing uses `user.role` (architecture.md 5.3). */
  user: UserDto | null;
  /** True only while the saved session is restored on app start. */
  isLoading: boolean;
  signIn: (input: LoginInput) => Promise<UserDto>;
  register: (input: RegisterInput) => Promise<UserDto>;
  requestPasswordReset: (identifier: string) => Promise<ForgotPasswordResponse>;
  resetPassword: (input: ResetPasswordInput) => Promise<UserDto>;
  completeProfile: (name: string, dropOffPoint?: string) => Promise<UserDto>;
  refreshUser: () => Promise<UserDto | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  const signOut = useCallback(async () => {
    tokenRef.current = null;
    setUser(null);
    await tokenStorage.clear();
  }, []);

  useEffect(() => {
    setAuthTokenProvider(async () => tokenRef.current);
    setOnUnauthorized(() => {
      console.warn('[AuthProvider] Session expired, signing out');
      void signOut();
    });
  }, [signOut]);

  // Restore session: saved token → GET /auth/me → role from the server (never from cache)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await tokenStorage.get();
        if (!saved) return;
        tokenRef.current = saved;
        const { user: me } = await authApi.getMe();
        if (!cancelled) setUser(me);
      } catch (err: any) {
        console.warn('[AuthProvider] Could not restore session:', err?.message ?? err);
        tokenRef.current = null;
        await tokenStorage.clear();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Stores the session; persists the token only when `remember` is true. */
  const startSession = useCallback(async (res: AuthTokenResponse, remember: boolean) => {
    tokenRef.current = res.token;
    if (remember) await tokenStorage.set(res.token);
    else await tokenStorage.clear();
    setUser(res.user);
    return res.user;
  }, []);

  const signIn = useCallback(
    async (input: LoginInput) => startSession(await authApi.login(input), Boolean(input.rememberMe)),
    [startSession]
  );

  const register = useCallback(
    async (input: RegisterInput) => startSession(await authApi.register(input), true),
    [startSession]
  );

  const requestPasswordReset = useCallback(
    (identifier: string) => authApi.forgotPassword({ identifier }),
    []
  );

  const resetPassword = useCallback(
    async (input: ResetPasswordInput) => startSession(await authApi.resetPassword(input), true),
    [startSession]
  );

  const completeProfile = useCallback(async (name: string, dropOffPoint?: string) => {
    const { user: updated } = await authApi.updateMe({ name, dropOffPoint: dropOffPoint as any });
    setUser(updated);
    return updated;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user: me } = await authApi.getMe();
      setUser(me);
      return me;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      signIn,
      register,
      requestPasswordReset,
      resetPassword,
      completeProfile,
      refreshUser,
      signOut,
    }),
    [user, isLoading, signIn, register, requestPasswordReset, resetPassword, completeProfile, refreshUser, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
