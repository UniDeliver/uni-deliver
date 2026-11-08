import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Brand, Font } from '@/theme/brand';
import { PressableScale } from './PressableScale';

type PillVariant = 'location' | 'campus';

interface Props {
  children: React.ReactNode;
  /** Show the round back button (falls back to /welcome when there is no history). */
  showBack?: boolean;
  pill?: PillVariant;
  /** Pinned to the bottom of the scroll content (e.g. "Don't have an account?") */
  footer?: React.ReactNode;
}

export function AuthScreen({ children, showBack = true, pill = 'location', footer }: Props) {
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(auth)/welcome'));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(350)} style={styles.topBar}>
            {showBack ? (
              <PressableScale onPress={goBack} style={styles.backButton} accessibilityLabel="Go back">
                <Feather name="arrow-left" size={22} color={Brand.ink} />
              </PressableScale>
            ) : (
              <View style={styles.backPlaceholder} />
            )}
            <CampusPill variant={pill} />
          </Animated.View>

          <View style={styles.body}>{children}</View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CampusPill({ variant }: { variant: PillVariant }) {
  if (variant === 'campus') {
    return (
      <View style={[styles.pill, styles.pillCampus]}>
        <Feather name="book-open" size={15} color={Brand.success} />
        <Text style={[styles.pillText, styles.pillCampusText]}>SABARAGAMUWA UNI</Text>
      </View>
    );
  }
  return (
    <View style={styles.pill}>
      <Feather name="map-pin" size={15} color={Brand.green} />
      <Text style={styles.pillText}>Sabaragamuwa Uni</Text>
    </View>
  );
}

export function FooterLink({ prompt, action, onPress }: { prompt: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.footerRow}>
      <Text style={styles.footerPrompt}>{prompt} </Text>
      <Pressable onPress={onPress} hitSlop={10}>
        <Text style={styles.footerAction}>{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.cream },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: { width: 48, height: 48 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.creamDeep,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillText: { fontFamily: Font.semibold, fontSize: 13, color: Brand.green },
  pillCampus: { backgroundColor: Brand.greenTint },
  pillCampusText: { color: Brand.success, letterSpacing: 0.6 },
  body: { flex: 1, paddingTop: 12 },
  footer: { paddingTop: 24 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerPrompt: { fontFamily: Font.regular, fontSize: 14, color: Brand.inkSoft },
  footerAction: { fontFamily: Font.bold, fontSize: 14, color: Brand.green },
});
