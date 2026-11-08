import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth';
import { useRouter } from 'expo-router';

export default function AccountSuspendedScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>⚠️</Text>
        </View>

        <Text style={styles.title}>Account Suspended</Text>
        <Text style={styles.subtitle}>
          Your account ({user?.phone}) has been suspended by administration.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Why has this happened?</Text>
          <Text style={styles.infoText}>
            This could be due to repeated order cancellations, uncollected COD orders, or terms violation.
          </Text>
          <Text style={[styles.infoText, { marginTop: 8 }]}>
            If you believe this is an error, please reach out to the campus coordinator or support desk at support@unideliver.lk.
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    padding: 28,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#EF4444',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    marginVertical: 24,
    width: '100%',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F87171',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
