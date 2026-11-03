import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ verificationId: string; phone: string }>();
  const { confirmPhoneOtp, isLoading, error } = useAuth();
  const [code, setCode] = useState('');

  const handleVerify = async () => {
    if (code.length < 6) return;

    try {
      const user = await confirmPhoneOtp(params.verificationId || 'dev-ver-id', code, params.phone);
      if (!user.profileComplete) {
        router.replace('/(auth)/complete-profile');
      } else {
        router.replace('/');
      }
    } catch (err) {
      console.error('OTP confirmation failed:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Enter verification code</Text>
        <Text style={styles.subtitle}>
          Sent to <Text style={styles.phoneHighlight}>{params.phone || '+94771234567'}</Text>
        </Text>

        <TextInput
          style={styles.otpInput}
          placeholder="123456"
          placeholderTextColor="#334155"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
          autoFocus
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, (code.length < 6 || isLoading) && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={code.length < 6 || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Verify & Proceed</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendButton} onPress={() => router.back()}>
          <Text style={styles.resendText}>Didn't receive code? Resend SMS</Text>
        </TouchableOpacity>
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
  header: {
    paddingVertical: 12,
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    marginTop: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
  phoneHighlight: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  otpInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 10,
    paddingVertical: 18,
    marginTop: 36,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resendButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    color: '#94A3B8',
    fontSize: 14,
  },
});
