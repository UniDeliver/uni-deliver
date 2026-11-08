import React from 'react';
import { Redirect, Stack, usePathname } from 'expo-router';
import { useAuth } from '@/features/auth';
import { Brand } from '@/theme/brand';

/**
 * Signed-out stack. As soon as the server returns a user (login, register or reset),
 * this layout hands off to "/" which routes by `user.role`.
 */
export default function AuthLayout() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  if (!isLoading && user) {
    if (!user.profileComplete && !pathname.includes('complete-profile')) {
      return <Redirect href="/(auth)/complete-profile" />;
    }
    if (user.profileComplete) {
      return <Redirect href="/" />;
    }
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Brand.cream },
        animation: 'slide_from_right',
        animationDuration: 280,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="complete-profile" options={{ animation: 'fade', gestureEnabled: false }} />
    </Stack>
  );
}
