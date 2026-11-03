import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth';
import { useRouter } from 'expo-router';

export default function CustomerHomeScreen() {
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
            <Text style={styles.greeting}>Deliver to Sabra Campus</Text>
            <Text style={styles.userName}>Hello, {user?.name || 'Customer'} 👋</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.roleTag}>
            <Text style={styles.roleText}>CUSTOMER ACCOUNT</Text>
          </View>
          <Text style={styles.phoneText}>📞 {user?.phone}</Text>
          {user?.email ? <Text style={styles.emailText}>✉️ {user.email}</Text> : null}
          <Text style={styles.statusText}>Status: <Text style={styles.activeStatus}>{user?.status}</Text></Text>
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Fast Campus Delivery 🚀</Text>
          <Text style={styles.bannerDesc}>All food orders are Cash on Delivery directly to your hostel entrance.</Text>
        </View>

        {/* Quick Menu Preview */}
        <Text style={styles.sectionTitle}>Featured Restaurants</Text>
        <View style={styles.restaurantList}>
          {['Main Cafeteria', 'Campus Bakehouse', 'Pambahinna Food Court', 'Belihuloya Spice Inn'].map((outlet, i) => (
            <View key={i} style={styles.restaurantCard}>
              <View style={styles.restaurantIcon}>
                <Text style={{ fontSize: 24 }}>🍛</Text>
              </View>
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>{outlet}</Text>
                <Text style={styles.restaurantMeta}>Open now • Avg 25 mins • LKR 100 delivery fee</Text>
              </View>
            </View>
          ))}
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
  userCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    gap: 8,
  },
  roleTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  phoneText: {
    color: '#E2E8F0',
    fontSize: 14,
  },
  emailText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  statusText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  activeStatus: {
    color: '#10B981',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  banner: {
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.25)',
    padding: 16,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF7A1A',
  },
  bannerDesc: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 4,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 4,
  },
  restaurantList: {
    gap: 12,
  },
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 14,
  },
  restaurantIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  restaurantMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
