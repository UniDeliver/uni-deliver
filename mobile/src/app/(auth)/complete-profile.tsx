import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { user, completeProfile, isLoading, error } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async () => {
    setValidationError('');
    if (!name.trim() || name.trim().length < 2) {
      setValidationError('Please enter your full name (at least 2 characters)');
      return;
    }

    try {
      await completeProfile(name.trim(), email.trim() || undefined);
      router.replace('/');
    } catch (err: any) {
      console.error('Failed to complete profile:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>FINAL STEP</Text>
        </View>
        <Text style={styles.title}>Complete your profile</Text>
        <Text style={styles.subtitle}>
          Tell us your name so riders and restaurants know who to deliver to.
        </Text>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Kasun Perera"
              placeholderTextColor="#475569"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (validationError) setValidationError('');
              }}
              autoFocus
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>University Email (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. kasun@std.sab.ac.lk"
              placeholderTextColor="#475569"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {(validationError || error) ? (
            <Text style={styles.errorText}>{validationError || error}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryButton, (!name.trim() || isLoading) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!name.trim() || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Start Ordering</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
    paddingHorizontal: 24,
  },
  content: {
    marginTop: 40,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: {
    color: '#FF7A1A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    lineHeight: 20,
  },
  form: {
    marginTop: 32,
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
