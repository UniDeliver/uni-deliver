import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeOutUp,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Brand, Font } from '@/theme/brand';

/** "──── OR SIGN IN WITH EMAIL ────" */
export function OrDivider({ label }: { label: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

/** Checkbox whose tick pops in with a spring. */
export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: React.ReactNode;
}) {
  const progress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(checked ? 1 : 0, { damping: 14, stiffness: 260 });
  }, [checked, progress]);

  const boxStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [Brand.surface, Brand.green]),
    borderColor: interpolateColor(progress.value, [0, 1], [Brand.border, Brand.green]),
  }));
  const tickStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.4 + progress.value * 0.6 }],
  }));

  return (
    <Pressable
      onPress={() => onChange(!checked)}
      style={styles.checkRow}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={6}
    >
      <Animated.View style={[styles.checkBox, boxStyle]}>
        <Animated.View style={tickStyle}>
          <Feather name="check" size={15} color="#fff" />
        </Animated.View>
      </Animated.View>
      <View style={styles.checkLabel}>{children}</View>
    </Pressable>
  );
}

/** Error / info banner that slides in above the submit button. */
export function FormBanner({ message, tone = 'error' }: { message?: string | null; tone?: 'error' | 'info' }) {
  if (!message) return null;
  const isError = tone === 'error';
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(16)}
      exiting={FadeOutUp.duration(150)}
      style={[styles.banner, isError ? styles.bannerError : styles.bannerInfo]}
      accessibilityLiveRegion="polite"
    >
      <Feather
        name={isError ? 'alert-circle' : 'info'}
        size={18}
        color={isError ? Brand.danger : Brand.success}
      />
      <Text style={[styles.bannerText, { color: isError ? Brand.danger : Brand.success }]}>{message}</Text>
    </Animated.View>
  );
}

export const textStyles = StyleSheet.create({
  body: { fontFamily: Font.regular, fontSize: 14, color: Brand.inkSoft },
  link: { fontFamily: Font.bold, fontSize: 14, color: Brand.green },
  linkUnderline: { fontFamily: Font.semibold, fontSize: 14, color: Brand.green, textDecorationLine: 'underline' },
});

const styles = StyleSheet.create({
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 22, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Brand.border },
  dividerText: { fontFamily: Font.semibold, fontSize: 12, color: Brand.inkMuted, letterSpacing: 1.2 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: { flexShrink: 1 },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  bannerError: { backgroundColor: Brand.dangerTint },
  bannerInfo: { backgroundColor: Brand.successTint },
  bannerText: { flex: 1, fontFamily: Font.medium, fontSize: 13.5, lineHeight: 19 },
});
