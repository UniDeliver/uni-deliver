import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth';

export default function PhoneLoginScreen() {
  const router = useRouter();
  const { sendPhoneOtp, isLoading, error, clearError } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [validationError, setValidationError] = useState('');

  const formatE164 = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return `+94${cleaned.slice(1)}`;
    }
    if (cleaned.startsWith('94')) {
      return `+${cleaned}`;
    }
    return `+94${cleaned}`;
  };

  const handleSendOtp = async () => {
    setValidationError('');
    clearError();

    const formatted = formatE164(phoneNumber);
    if (!/^\+94\d{9}$/.test(formatted)) {
      setValidationError('Please enter a valid 9-digit Sri Lankan phone number (e.g. 771234567)');
      return;
    }

    try {
      const { verificationId } = await sendPhoneOtp(formatted);
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { verificationId, phone: formatted },
      });
    } catch (err: any) {
      console.error(err);
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
        <Text style={styles.title}>What's your phone number?</Text>
        <Text style={styles.subtitle}>
          We will send an SMS with a 6-digit verification code to confirm your device.
        </Text>

        <View style={styles.inputContainer}>
          <View style={styles.countryCodeBadge}>
            <Text style={styles.flag}>🇱🇰</Text>
            <Text style={styles.countryCodeText}>+94</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="77 123 4567"
            placeholderTextColor="#475569"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              if (validationError) setValidationError('');
            }}
            autoFocus
          />
        </View>

        {(validationError || error) ? (
          <Text style={styles.errorText}>{validationError || error}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={isLoading || !phoneNumber.trim()}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Send Verification Code</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By continuing, you agree to receive SMS codes for verification and accept our Terms of Service.
        </Text>
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
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 32,
    overflow: 'hidden',
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  flag: {
    fontSize: 18,
  },
  countryCodeText: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});
