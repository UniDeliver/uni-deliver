import React, { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
import { loginSchema } from '@unideliver/shared';
import { useAuth } from '@/features/auth';
import { fromApiError, validate, type FieldErrors } from '@/features/auth/form-errors';
import { ApiError } from '@/api/client';
import {
  AuthScreen,
  BrandHeader,
  Checkbox,
  Field,
  FooterLink,
  FormBanner,
  GoogleButton,
  OrDivider,
  PrimaryButton,
  enter,
  textStyles,
} from '@/components/auth';

/**
 * Stitch: "Uni Deliver - Customer Login". Used by customers AND delivery agents.
 * On success the (auth) layout redirects to "/", which routes by the role the server returned.
 */
export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ identifier?: string }>();
  const { signIn } = useAuth();

  const [identifier, setIdentifier] = useState(params.identifier ?? '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const submit = async () => {
    const input = { identifier, password, rememberMe };
    const invalid = validate(loginSchema, input);
    setErrors(invalid ?? {});
    setFormError(null);
    setNeedsPassword(false);
    if (invalid) return;

    setSubmitting(true);
    try {
      await signIn(input);
    } catch (err) {
      const { fieldErrors, formError: message } = fromApiError(err);
      setErrors(fieldErrors);
      setFormError(message);
      setNeedsPassword(err instanceof ApiError && err.code === 'PASSWORD_NOT_SET');
    } finally {
      setSubmitting(false);
    }
  };

  const goToForgot = () =>
    router.push({ pathname: '/(auth)/forgot-password', params: identifier ? { identifier } : {} });

  return (
    <AuthScreen
      footer={<FooterLink prompt="Don't have an account?" action="Register" onPress={() => router.replace('/(auth)/register')} />}
    >
      <BrandHeader title="Welcome back" subtitle="Sign in to order food to your campus hostel or lecture hall" />

      <Animated.View entering={enter(4)}>
        <GoogleButton
          label="Continue with Google"
          onPress={() => Alert.alert('Coming soon', 'Google sign-in is not available yet. Please use your email or phone.')}
        />
      </Animated.View>

      <Animated.View entering={enter(5)}>
        <OrDivider label="OR LOG IN WITH CREDENTIALS" />
      </Animated.View>

      <Animated.View entering={enter(6)}>
        <Field
          label="Campus email or phone number"
          icon="mail"
          placeholder="student@susl.ac.lk or 07X XXX XXXX"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="username"
          autoComplete="username"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          error={errors.identifier}
        />
      </Animated.View>

      <Animated.View entering={enter(7)}>
        <Field
          ref={passwordRef}
          label="Password"
          icon="lock"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureToggle
          textContentType="password"
          autoComplete="current-password"
          returnKeyType="go"
          onSubmitEditing={submit}
          error={errors.password}
        />
      </Animated.View>

      <Animated.View entering={enter(8)} style={styles.optionsRow}>
        <Checkbox checked={rememberMe} onChange={setRememberMe}>
          <Text style={textStyles.body}>Remember me</Text>
        </Checkbox>
        <Pressable onPress={goToForgot} hitSlop={10}>
          <Text style={textStyles.link}>Forgot password?</Text>
        </Pressable>
      </Animated.View>

      <FormBanner message={formError} />
      {needsPassword ? (
        <Pressable onPress={goToForgot} style={styles.setPassword}>
          <Text style={textStyles.linkUnderline}>Set my password now</Text>
        </Pressable>
      ) : null}

      <Animated.View entering={enter(9)}>
        <PrimaryButton label="Log In" icon="arrow-right" onPress={submit} loading={submitting} />
      </Animated.View>

      <View style={styles.spacer} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  setPassword: { alignSelf: 'center', marginTop: -6, marginBottom: 16 },
  spacer: { flex: 1, minHeight: 16 },
});
