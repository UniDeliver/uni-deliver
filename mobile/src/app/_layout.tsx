import React, { useState } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Caveat_700Bold } from '@expo-google-fonts/caveat/700Bold';
import { AuthProvider, useAuth } from '@/features/auth';
import { AnimatedSplash } from '@/components/AnimatedSplash';
import { markSplashDone } from '@/lib/splash-state';

// Keep the native splash up until AnimatedSplash has mounted and takes over
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Caveat_700Bold,
  });

  // Native splash stays visible while fonts load (usually < 100 ms)
  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 320 }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          {/* No cross-fade: the splash hands off to welcome frame-for-frame, a fade would dim it */}
          <Stack.Screen name="(auth)" options={{ animation: 'none' }} />
          <Stack.Screen name="(customer)" />
          <Stack.Screen name="(rider)" />
          <Stack.Screen name="unsupported-role" />
          <Stack.Screen name="account-suspended" />
        </Stack>
        <SplashGate />
      </AuthProvider>
    </ThemeProvider>
  );
}

/** Shows the animated splash until the saved session has been checked with the server. */
function SplashGate() {
  const { isLoading, user } = useAuth();
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <AnimatedSplash
      ready={!isLoading}
      // Signed-out users land on welcome, which continues from the splash's last frame
      exit={user ? 'lift' : 'dissolve'}
      onFinish={() => {
        setVisible(false);
        markSplashDone();
      }}
    />
  );
}
