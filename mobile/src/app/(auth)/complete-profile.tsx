import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { useAuth } from '@/features/auth';
import { fromApiError } from '@/features/auth/form-errors';
import { AuthScreen, BrandHeader, DropOffSelect, Field, FormBanner, PrimaryButton, enter, textStyles } from '@/components/auth';

/**
 * Shown when the server returns profileComplete === false
 * (e.g. an account created through the admin portal or a future Google sign-in without a name).
 */
export default function CompleteProfileScreen() {
  const { user, completeProfile, signOut } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [dropOffPoint, setDropOffPoint] = useState<string | null>(user?.dropOffPoint ?? null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }
    setNameError(null);
    setFormError(null);
    setSubmitting(true);
    try {
      await completeProfile(name.trim(), dropOffPoint ?? undefined);
      // (auth) layout routes to "/" once profileComplete flips to true
    } catch (err) {
      const { fieldErrors, formError: message } = fromApiError(err);
      setNameError(fieldErrors.name ?? null);
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen showBack={false}>
      <BrandHeader title="Almost there" subtitle="Tell us your name so riders know who to hand your order to." />

      <Animated.View entering={enter(4)}>
        <Field
          label="Full Name"
          required
          icon="user"
          placeholder="e.g. Dilshan Fernando"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
          error={nameError}
        />
      </Animated.View>

      {user?.role === 'customer' ? (
        <Animated.View entering={enter(5)}>
          <DropOffSelect value={dropOffPoint} onChange={setDropOffPoint} />
        </Animated.View>
      ) : null}

      <FormBanner message={formError} />

      <Animated.View entering={enter(6)}>
        <PrimaryButton label="Continue" onPress={submit} loading={submitting} />
      </Animated.View>

      <Pressable onPress={signOut} style={styles.signOut} hitSlop={10}>
        <Text style={textStyles.link}>Sign out</Text>
      </Pressable>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  signOut: { alignSelf: 'center', marginTop: 20 },
});
