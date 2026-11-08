import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { forgotPasswordSchema, isEmailIdentifier } from '@unideliver/shared';
import { useAuth } from '@/features/auth';
import { fromApiError, validate } from '@/features/auth/form-errors';
import { Brand, Font } from '@/theme/brand';
import { AuthScreen, BrandHeader, Field, FooterLink, FormBanner, PrimaryButton, enter } from '@/components/auth';

type Mode = 'email' | 'phone';
const HELPDESK_PHONE = '+94452280014';

/** Stitch: "Uni Deliver - Forgot Password". Delivery agents also use this to set their first password. */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ identifier?: string }>();
  const { requestPasswordReset } = useAuth();

  const initial = params.identifier ?? '';
  const [mode, setMode] = useState<Mode>(initial && !isEmailIdentifier(initial) ? 'phone' : 'email');
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setValue('');
    setError(null);
  };

  const submit = async () => {
    const invalid = validate(forgotPasswordSchema, { identifier: value });
    const wrongKind = value && (mode === 'email') !== isEmailIdentifier(value);
    setError(wrongKind ? `Enter a valid ${mode === 'email' ? 'email address' : 'mobile number'}` : invalid?.identifier ?? null);
    setFormError(null);
    if (invalid || wrongKind) return;

    setSubmitting(true);
    try {
      const res = await requestPasswordReset(value.trim());
      router.push({
        pathname: '/(auth)/reset-password',
        params: { identifier: value.trim(), ...(res.devCode ? { devCode: res.devCode } : {}) },
      });
    } catch (err) {
      const { fieldErrors, formError: message } = fromApiError(err);
      setError(fieldErrors.identifier ?? null);
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen
      pill="campus"
      footer={
        <View style={styles.footer}>
          <FooterLink prompt="Remember your password?" action="Sign in" onPress={() => router.replace('/(auth)/login')} />
          <View style={styles.helpPill}>
            <Feather name="headphones" size={15} color={Brand.inkSoft} />
            <Text style={styles.helpText}>Need help? Belihuloya Campus IT Helpdesk</Text>
          </View>
          <Pressable onPress={() => Linking.openURL(`tel:${HELPDESK_PHONE}`)} hitSlop={8} style={styles.callRow}>
            <Text style={styles.callText}>Call Desk (+94 45 2280014)</Text>
            <Feather name="external-link" size={13} color={Brand.inkMuted} />
          </Pressable>
        </View>
      }
    >
      <BrandHeader
        badge={{ icon: 'rotate-ccw', label: 'Account Recovery' }}
        title="Reset Password"
        titleColor={Brand.ink}
        subtitle="Enter your university student email or phone number to receive a verification code."
      />

      <Animated.View entering={enter(4)}>
        <SegmentedToggle mode={mode} onChange={switchMode} />
      </Animated.View>

      <Animated.View entering={enter(5)}>
        {mode === 'email' ? (
          <Field
            key="email"
            label="University Email"
            icon="mail"
            placeholder="kasun.p@std.appsci.sab.ac.lk"
            value={value}
            onChangeText={setValue}
            clearable
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={submit}
            hint="e.g. index number or campus portal identity"
            error={error}
          />
        ) : (
          <Field
            key="phone"
            label="Registered Phone Number"
            icon="phone"
            placeholder="07X XXX XXXX"
            value={value}
            onChangeText={setValue}
            clearable
            keyboardType="phone-pad"
            autoComplete="tel"
            returnKeyType="send"
            onSubmitEditing={submit}
            hint="Delivery agents: use the number your admin registered"
            error={error}
          />
        )}
      </Animated.View>

      <Animated.View entering={enter(6)} style={styles.guarantee}>
        <View style={styles.guaranteeIcon}>
          <Feather name="shield" size={20} color={Brand.amberDeep} />
        </View>
        <View style={styles.guaranteeBody}>
          <Text style={styles.guaranteeTitle}>Campus Verification Guarantee</Text>
          <Text style={styles.guaranteeText}>
            Only verified Sabaragamuwa University emails (<Text style={styles.bold}>@std.sab.ac.lk</Text>) and
            registered student phone numbers can receive instant recovery codes.
          </Text>
        </View>
      </Animated.View>

      <FormBanner message={formError} />

      <Animated.View entering={enter(7)}>
        <PrimaryButton label="Send Reset Code" icon="arrow-right" onPress={submit} loading={submitting} />
      </Animated.View>
    </AuthScreen>
  );
}

/** Two-option toggle with a pill that springs between sides. */
function SegmentedToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(mode === 'email' ? 0 : 1);

  const pillStyle = useAnimatedStyle(() => ({
    width: width / 2 - 6,
    transform: [{ translateX: x.value * (width / 2) }],
  }));

  const select = (m: Mode) => {
    x.value = withSpring(m === 'email' ? 0 : 1, { damping: 18, stiffness: 220 });
    onChange(m);
  };

  return (
    <View style={styles.toggle} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? <Animated.View style={[styles.togglePill, pillStyle]} /> : null}
      {(['email', 'phone'] as const).map(m => {
        const active = m === mode;
        return (
          <Pressable
            key={m}
            style={styles.toggleOption}
            onPress={() => select(m)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Feather name={m === 'email' ? 'at-sign' : 'phone'} size={18} color={active ? '#fff' : Brand.inkSoft} />
            <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
              {m === 'email' ? 'Student Email' : 'Phone Number'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    backgroundColor: Brand.creamDeep,
    borderRadius: 999,
    padding: 6,
    marginBottom: 22,
  },
  togglePill: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 6,
    borderRadius: 999,
    backgroundColor: Brand.greenDark,
  },
  toggleOption: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  toggleText: { fontFamily: Font.semibold, fontSize: 14.5, color: Brand.inkSoft },
  toggleTextActive: { color: '#fff' },
  guarantee: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: Brand.creamDeep,
    borderRadius: 20,
    padding: 16,
    marginTop: 4,
    marginBottom: 22,
  },
  guaranteeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.amberTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guaranteeBody: { flex: 1 },
  guaranteeTitle: { fontFamily: Font.bold, fontSize: 15, color: Brand.ink, marginBottom: 4 },
  guaranteeText: { fontFamily: Font.regular, fontSize: 13.5, lineHeight: 20, color: Brand.inkSoft },
  bold: { fontFamily: Font.bold, color: Brand.ink },
  footer: { alignItems: 'center', gap: 14 },
  helpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.creamDeep,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    marginTop: 8,
  },
  helpText: { fontFamily: Font.medium, fontSize: 13, color: Brand.inkSoft },
  callRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  callText: { fontFamily: Font.semibold, fontSize: 13, color: Brand.inkMuted },
});
