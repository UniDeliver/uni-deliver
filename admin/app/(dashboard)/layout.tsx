'use client';

import React, { useEffect } from 'react';
import { useAdminAuth } from '../../src/context/AdminAuthContext';
import { Role } from '@unideliver/shared';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { adminUser, isLoading, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!adminUser || adminUser.role !== Role.ADMIN) {
        router.replace('/login');
      }
    }
  }, [adminUser, isLoading, router]);

  if (isLoading || !adminUser || adminUser.role !== Role.ADMIN) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Overview', href: '/', icon: '📊' },
    { label: 'Live Orders', href: '/orders', icon: '📦' },
    { label: 'Restaurants', href: '/restaurants', icon: '🍽️' },
    { label: 'Riders', href: '/riders', icon: '🛵' },
    { label: 'Customers', href: '/customers', icon: '👥' },
    { label: 'Settings & Fees', href: '/settings', icon: '⚙️' },
    { label: 'Reports', href: '/reports', icon: '📈' },
    { label: 'Feedback', href: '/feedback', icon: '💬' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/60 border-r border-slate-800 flex flex-col justify-between p-4 fixed h-full z-20 backdrop-blur-xl">
        <div className="space-y-6">
          <div className="px-2 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍔</span>
              <div>
                <h1 className="font-extrabold text-base tracking-tight text-white">UniDeliver</h1>
                <p className="text-[10px] uppercase font-bold tracking-wider text-orange-500">
                  Operations Admin
                </p>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-orange-600/15 text-orange-400 border border-orange-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin Footer & Logout */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-xs">
              {adminUser.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{adminUser.name || 'Administrator'}</p>
              <p className="text-[11px] text-slate-400 truncate">{adminUser.email || adminUser.phone}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
