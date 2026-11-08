import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { RESET_CODE_LENGTH, resetPasswordSchema } from '@unideliver/shared';
import { useAuth } from '@/features/auth';
import { fromApiError, validate, type FieldErrors } from '@/features/auth/form-errors';
import { Brand, Font } from '@/theme/brand';
import { AuthScreen, BrandHeader, Field, FormBanner, PrimaryButton, enter, textStyles } from '@/components/auth';

const RESEND_SECONDS = 45;

/**
 * Step 2 of password recovery (not a Stitch screen; built in the same visual language).
 * Code + new password → signed in → routed by role.
 */
export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ identifier: string; devCode?: string }>();
  const identifier = params.identifier ?? '';
  const { resetPassword, requestPasswordReset } = useAuth();

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState(params.devCode);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async () => {
    const input = { identifier, code, newPassword, confirmPassword };
    const invalid = validate(resetPasswordSchema, input);
    setErrors(invalid ?? {});
    setFormError(null);
    if (invalid) return;

    setSubmitting(true);
    try {
      await resetPassword(input);
    } catch (err) {
      const { fieldErrors, formError: message } = fromApiError(err);
      setErrors(fieldErrors);
      setFormError(message);
      setCode('');
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setCooldown(RESEND_SECONDS);
    setFormError(null);
    try {
      const res = await requestPasswordReset(identifier);
      setDevCode(res.devCode);
    } catch (err) {
      setFormError(fromApiError(err).formError);
    }
  };

  return (
    <AuthScreen pill="campus">
      <BrandHeader
        badge={{ icon: 'key', label: 'Verification' }}
        title="Enter your code"
        titleColor={Brand.ink}
        subtitle={`We sent a ${RESET_CODE_LENGTH}-digit code to ${identifier}. It expires in 10 minutes.`}
      />

      {devCode ? (
        <Animated.View entering={enter(4)}>
          <FormBanner tone="info" message={`Development build: your code is ${devCode}`} />
        </Animated.View>
      ) : null}

      <Animated.View entering={enter(5)}>
        <CodeInput value={code} onChange={setCode} error={errors.code} />
      </Animated.View>

      <Animated.View entering={enter(6)} style={styles.resendRow}>
        {cooldown > 0 ? (
          <Text style={textStyles.body}>Resend code in {cooldown}s</Text>
        ) : (
          <Pressable onPress={resend} hitSlop={10}>
            <Text style={textStyles.link}>Resend code</Text>
          </Pressable>
        )}
      </Animated.View>

      <Animated.View entering={enter(7)}>
        <Field
          label="New Password"
          icon="lock"
          placeholder="At least 8 characters"
          value={newPassword}
          onChangeText={setNewPassword}
          secureToggle
          textContentType="newPassword"
          autoComplete="new-password"
          error={errors.newPassword}
        />
      </Animated.View>
      <Animated.View entering={enter(8)}>
        <Field
          label="Confirm Password"
          icon="lock"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureToggle
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
          error={errors.confirmPassword}
        />
      </Animated.View>

      <FormBanner message={formError} />

      <Animated.View entering={enter(9)}>
        <PrimaryButton label="Reset & Sign In" icon="arrow-right" onPress={submit} loading={submitting} />
      </Animated.View>
    </AuthScreen>
  );
}

/** Six boxes over one hidden TextInput. Filled digits fade in; errors shake the row. */
function CodeInput({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (error) {
      shake.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [error, shake]);

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  return (
    <View>
      <Pressable onPress={() => inputRef.current?.focus()} accessibilityLabel="Verification code">
        <Animated.View style={[styles.codeRow, rowStyle]}>
          {Array.from({ length: RESET_CODE_LENGTH }).map((_, i) => {
            const digit = value[i];
            const active = focused && i === Math.min(value.length, RESET_CODE_LENGTH - 1);
            return (
              <View
                key={i}
                style={[styles.codeBox, active && styles.codeBoxActive, error ? styles.codeBoxError : null]}
              >
                {digit ? (
                  <Animated.Text entering={FadeIn.duration(120)} style={styles.codeDigit}>
                    {digit}
                  </Animated.Text>
                ) : null}
              </View>
            );
          })}
        </Animated.View>
      </Pressable>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={t => onChange(t.replace(/\D/g, '').slice(0, RESET_CODE_LENGTH))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={RESET_CODE_LENGTH}
        autoFocus
        style={styles.hiddenInput}
      />
      {error ? <Text style={styles.codeError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  codeBox: {
    flex: 1,
    aspectRatio: 0.85,
    maxHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxActive: { borderColor: Brand.green, borderWidth: 2 },
  codeBoxError: { borderColor: Brand.danger },
  codeDigit: { fontFamily: Font.bold, fontSize: 24, color: Brand.green },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  codeError: { fontFamily: Font.medium, fontSize: 12.5, color: Brand.danger, marginTop: 8, textAlign: 'center' },
  resendRow: { alignItems: 'center', marginTop: 14, marginBottom: 20 },
});
