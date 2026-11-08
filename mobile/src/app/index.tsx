import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { AccountStatus, Role } from '@unideliver/shared';
import { useAuth } from '@/features/auth';
import { Brand } from '@/theme/brand';

/**
 * Role router (architecture.md 5.3). Every successful login, registration, password reset
 * and app start lands here. It routes by the `role` the SERVER returned, never a cached value.
 * While the session restores, the animated splash in the root layout covers this screen.
 */
export default function RoleRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <View style={{ flex: 1, backgroundColor: Brand.green }} />;
  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (user.status === AccountStatus.SUSPENDED) return <Redirect href="/account-suspended" />;
  if (!user.profileComplete) return <Redirect href="/(auth)/complete-profile" />;

  switch (user.role) {
    case Role.CUSTOMER:
      return <Redirect href="/(customer)/(tabs)/home" />;
    case Role.RIDER:
      return <Redirect href="/(rider)/(tabs)/available" />;
    case Role.ADMIN:
      return <Redirect href="/unsupported-role" />;
    default:
      return <Redirect href="/(auth)/welcome" />;
  }
}
