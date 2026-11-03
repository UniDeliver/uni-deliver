import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth';
import { Role } from '@unideliver/shared';

export default function WelcomeScreen() {
  const router = useRouter();
  const { signInWithDevToken } = useAuth();

  const handleDevQuickLogin = async (role: Role, phone: string, name?: string) => {
    try {
      await signInWithDevToken(`uid-${Date.now().toString().slice(-4)}`, phone, role, name);
      router.replace('/');
    } catch (e: any) {
      console.error('Quick login failed:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SABARAGAMUWA UNIVERSITY</Text>
          </View>
          <Text style={styles.title}>
            Hot meals delivered to your <Text style={styles.highlight}>hostel door.</Text>
          </Text>
          <Text style={styles.subtitle}>
            Order from Belihuloya and Pambahinna restaurants with zero cash friction.
          </Text>
        </View>

        <View style={styles.illustrationCard}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🍔</Text>
            <View>
              <Text style={styles.featureTitle}>Favorite Outlets</Text>
              <Text style={styles.featureDesc}>Campus cafeterias & local spots</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⚡</Text>
            <View>
              <Text style={styles.featureTitle}>Fast Delivery</Text>
              <Text style={styles.featureDesc}>By verified student riders</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💵</Text>
            <View>
              <Text style={styles.featureTitle}>Cash on Delivery</Text>
              <Text style={styles.featureDesc}>Simple & reliable payment</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/phone-login')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Continue with Phone Number</Text>
          </TouchableOpacity>

          {/* Quick Dev Switcher for pairing/testing */}
          <View style={styles.devSection}>
            <Text style={styles.devHeader}>DEVELOPMENT FAST-LOGIN</Text>
            <View style={styles.devButtonsRow}>
              <TouchableOpacity
                style={[styles.devButton, { borderColor: '#3B82F6' }]}
                onPress={() => handleDevQuickLogin(Role.CUSTOMER, '+94771234567', 'Nimal Customer')}
              >
                <Text style={styles.devButtonText}>Customer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.devButton, { borderColor: '#10B981' }]}
                onPress={() => handleDevQuickLogin(Role.RIDER, '+94779998888', 'Sunil Rider')}
              >
                <Text style={styles.devButtonText}>Rider</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.devButton, { borderColor: '#F59E0B' }]}
                onPress={() => handleDevQuickLogin(Role.CUSTOMER, '+94770001111', '')}
              >
                <Text style={styles.devButtonText}>New User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  heroSection: {
    marginTop: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
    marginBottom: 16,
  },
  badgeText: {
    color: '#FF7A1A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  highlight: {
    color: '#FF6B00',
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    marginTop: 12,
    lineHeight: 22,
  },
  illustrationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    marginVertical: 24,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  featureDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  actionSection: {
    gap: 16,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  devSection: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  devHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  devButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  devButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  devButtonText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
});
