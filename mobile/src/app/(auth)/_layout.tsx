import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/features/auth';
import { usePathname } from 'expo-router';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  // If user is already authenticated with complete profile and not on complete-profile page, redirect to home
  if (!isLoading && user && user.profileComplete && !pathname.includes('complete-profile')) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0B0F19' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="phone-login" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="complete-profile" />
    </Stack>
  );
}
