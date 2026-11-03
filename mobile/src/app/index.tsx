import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/features/auth';
import { Role, AccountStatus } from '@unideliver/shared';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoleRouterScreen() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.content}>
          <Text style={styles.brandTitle}>UniDeliver</Text>
          <Text style={styles.brandSubtitle}>Campus Food & Delivery</Text>
          <ActivityIndicator size="large" color="#FF6B00" style={styles.spinner} />
          <Text style={styles.loadingText}>Connecting to session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 1. Not authenticated -> Redirect to welcome
  if (!user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // 2. Suspended account -> Redirect to suspended screen
  if (user.status === AccountStatus.SUSPENDED) {
    return <Redirect href="/account-suspended" />;
  }

  // 3. New customer with incomplete profile -> Complete profile first
  if (!user.profileComplete) {
    return <Redirect href="/(auth)/complete-profile" />;
  }

  // 4. Role-based routing (Section 5.3)
  if (user.role === Role.CUSTOMER) {
    return <Redirect href="/(customer)/(tabs)/home" />;
  }

  if (user.role === Role.RIDER) {
    return <Redirect href="/(rider)/(tabs)/available" />;
  }

  if (user.role === Role.ADMIN) {
    return <Redirect href="/unsupported-role" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
  spinner: {
    marginTop: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#64748B',
    fontSize: 13,
  },
});
