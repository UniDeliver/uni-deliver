'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '../../src/context/AdminAuthContext';

export default function AdminLoginPage() {
  const { login, loginWithDevToken, isLoading, error, clearError } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clientError, setClientError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');
    clearError();

    if (!email.trim() || !password.trim()) {
      setClientError('Please enter both email and password.');
      return;
    }

    try {
      await login(email.trim(), password);
    } catch {
      // Error handled in context
    }
  };

  const handleDevLogin = async () => {
    setClientError('');
    clearError();
    await loginWithDevToken();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-8 bg-slate-900/60 p-8 sm:p-10 rounded-2xl border border-slate-800 backdrop-blur-xl relative z-10 shadow-2xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-4">
            UniDeliver Operations
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Admin Portal</h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in with authorized administrator credentials
          </p>
        </div>

        {(clientError || error) && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div className="flex-1 font-medium">{clientError || error}</div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm"
                placeholder="admin@unideliver.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-600/25 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        {/* Development Fast Login Helper */}
        <div className="pt-4 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">
            Development Quick Access
          </p>
          <button
            type="button"
            onClick={handleDevLogin}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700/60 transition-all cursor-pointer"
          >
            ⚡ Quick Sign-in as Seeded Admin
          </button>
        </div>
      </div>
    </div>
  );
}
