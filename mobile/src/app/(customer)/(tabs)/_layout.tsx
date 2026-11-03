import React from 'react';
import { Stack } from 'expo-router';

export default function CustomerTabsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0B0F19' } }}>
      <Stack.Screen name="home" />
    </Stack>
  );
}
