import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth';
import { useRouter } from 'expo-router';

export default function RiderAvailableScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Rider Portal</Text>
            <Text style={styles.userName}>{user?.name || 'Rider Partner'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Rider Vehicle & Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.badgeRow}>
            <View style={styles.roleTag}>
              <Text style={styles.roleText}>CAMPUS RIDER</Text>
            </View>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>AVAILABLE FOR ORDERS</Text>
            </View>
          </View>

          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleLabel}>Vehicle Number:</Text>
            <Text style={styles.vehicleValue}>{user?.rider?.vehicleNo || 'Registered Bike'}</Text>
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleLabel}>Phone:</Text>
            <Text style={styles.vehicleValue}>{user?.phone}</Text>
          </View>
        </View>

        {/* Available Orders Section */}
        <Text style={styles.sectionTitle}>Available Delivery Requests</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🛵</Text>
          <Text style={styles.emptyTitle}>Scanning for live orders...</Text>
          <Text style={styles.emptySubtitle}>
            When a customer in your campus zone places an order, it will appear here for atomic acceptance.
          </Text>
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
  content: {
    padding: 20,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  onlineText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  vehicleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vehicleLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  vehicleValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 8,
  },
  emptyState: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
