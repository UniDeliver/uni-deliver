'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../src/context/AdminAuthContext';
import { Role } from '@unideliver/shared';

export default function AdminRootRedirect() {
  const { adminUser, isLoading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (adminUser && adminUser.role === Role.ADMIN) {
        // Already on dashboard group
      } else {
        router.replace('/login');
      }
    }
  }, [adminUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (adminUser && adminUser.role === Role.ADMIN) {
    // Dynamically render dashboard page
    const AdminOverviewPage = require('./(dashboard)/page').default;
    const DashboardLayout = require('./(dashboard)/layout').default;
    return (
      <DashboardLayout>
        <AdminOverviewPage />
      </DashboardLayout>
    );
  }

  return null;
}
