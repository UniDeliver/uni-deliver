import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { registerSchema } from '@unideliver/shared';
import { useAuth } from '@/features/auth';
import { fromApiError, validate, type FieldErrors } from '@/features/auth/form-errors';
import { Brand, Font } from '@/theme/brand';
import {
  AuthScreen,
  BrandHeader,
  Checkbox,
  DropOffSelect,
  Field,
  FooterLink,
  FormBanner,
  GoogleButton,
  OrDivider,
  PrimaryButton,
  enter,
  textStyles,
} from '@/components/auth';

/** Stitch: "Uni Deliver - Registration". Customers only; delivery agents are created by an admin. */
export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dropOffPoint: null as string | null,
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const set = <K extends keyof typeof form>(key: K) => (value: (typeof form)[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key as string]) setErrors(({ [key as string]: _, ...rest }) => rest);
  };

  const submit = async () => {
    const input = { ...form, phone: `+94${form.phone}` };
    const invalid = validate(registerSchema, input);
    setErrors(invalid ?? {});
    setFormError(null);
    if (invalid) return;

    setSubmitting(true);
    try {
      await register(input as any);
      // (auth) layout sees the new user and routes to "/" → customer home
    } catch (err) {
      const { fieldErrors, formError: message } = fromApiError(err);
      setErrors(fieldErrors);
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen
      footer={<FooterLink prompt="Already have an account?" action="Sign in" onPress={() => router.replace('/(auth)/login')} />}
    >
      <BrandHeader title="Create Account" subtitle="Join Uni Deliver for fast campus meals & essentials" />

      <Animated.View entering={enter(4)}>
        <GoogleButton
          label="Sign up with Google"
          onPress={() => Alert.alert('Coming soon', 'Google sign-up is not available yet. Please register with your email.')}
        />
      </Animated.View>

      <Animated.View entering={enter(5)}>
        <OrDivider label="OR REGISTER WITH EMAIL" />
      </Animated.View>

      <Animated.View entering={enter(6)}>
        <Field
          label="Full Name"
          required
          placeholder="e.g. Dilshan Fernando"
          value={form.name}
          onChangeText={set('name')}
          autoCapitalize="words"
          textContentType="name"
          autoComplete="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          error={errors.name}
        />
      </Animated.View>

      <Animated.View entering={enter(7)}>
        <Field
          ref={emailRef}
          label="Email Address"
          required
          labelAccessory={
            <View style={styles.promo}>
              <Feather name="check-circle" size={13} color={Brand.success} />
              <Text style={styles.promoText}>15% Off First Order</Text>
            </View>
          }
          placeholder="name@example.com"
          value={form.email}
          onChangeText={set('email')}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          returnKeyType="next"
          onSubmitEditing={() => phoneRef.current?.focus()}
          error={errors.email}
        />
      </Animated.View>

      <Animated.View entering={enter(8)}>
        <Field
          ref={phoneRef}
          label="Phone Number"
          required
          prefix={
            <View style={styles.countryCode}>
              <Text style={styles.flag}>🇱🇰</Text>
              <Text style={styles.countryText}>+94</Text>
            </View>
          }
          placeholder="77 412 8990"
          value={form.phone}
          onChangeText={v => set('phone')(v.replace(/[^\d ]/g, '').replace(/^0/, ''))}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          maxLength={11}
          error={errors.phone}
        />
      </Animated.View>

      <Animated.View entering={enter(9)}>
        <DropOffSelect value={form.dropOffPoint} onChange={set('dropOffPoint')} error={errors.dropOffPoint} />
      </Animated.View>

      <Animated.View entering={enter(10)} style={styles.passwordRow}>
        <View style={styles.half}>
          <Field
            ref={passwordRef}
            label="Password"
            required
            placeholder="••••••••"
            value={form.password}
            onChangeText={set('password')}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
            error={errors.password}
          />
        </View>
        <View style={styles.half}>
          <Field
            ref={confirmRef}
            label="Confirm"
            required
            placeholder="••••••••"
            value={form.confirmPassword}
            onChangeText={set('confirmPassword')}
            secureTextEntry
            textContentType="newPassword"
            returnKeyType="done"
            error={errors.confirmPassword}
          />
        </View>
      </Animated.View>

      <Animated.View entering={enter(11)} style={styles.terms}>
        <Checkbox checked={form.acceptTerms} onChange={set('acceptTerms')}>
          <Text style={textStyles.body}>
            I agree to the{' '}
            <Text
              style={textStyles.linkUnderline}
              onPress={() =>
                // TODO: link the published terms page once it exists
                Alert.alert('Campus Delivery Terms', 'The full terms will be published before launch.')
              }
            >
              Campus Delivery Terms
            </Text>{' '}
            & Code
          </Text>
        </Checkbox>
        {errors.acceptTerms ? <Text style={styles.termsError}>{errors.acceptTerms}</Text> : null}
      </Animated.View>

      <FormBanner message={formError} />

      <Animated.View entering={enter(12)}>
        <PrimaryButton label="Create Account" onPress={submit} loading={submitting} />
      </Animated.View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Brand.successTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  promoText: { fontFamily: Font.semibold, fontSize: 12, color: Brand.success },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 12,
    marginRight: 12,
    borderRightWidth: 1,
    borderRightColor: Brand.border,
  },
  flag: { fontSize: 18 },
  countryText: { fontFamily: Font.semibold, fontSize: 16, color: Brand.ink },
  passwordRow: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  terms: { marginTop: 2, marginBottom: 20, paddingHorizontal: 4 },
  termsError: { fontFamily: Font.medium, fontSize: 12.5, color: Brand.danger, marginTop: 6, marginLeft: 32 },
});
