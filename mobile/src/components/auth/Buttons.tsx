import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Brand, Font } from '@/theme/brand';
import { PressableScale } from './PressableScale';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: 'chevron-right' | 'arrow-right';
}

/** Big green pill button. The arrow nudges forward on a loop to invite the tap. */
export function PrimaryButton({ label, onPress, loading, disabled, icon = 'chevron-right' }: PrimaryButtonProps) {
  const nudge = useSharedValue(0);

  useEffect(() => {
    nudge.value = withRepeat(
      withSequence(
        withTiming(4, { duration: 500, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 500, easing: Easing.in(Easing.quad) }),
        withTiming(0, { duration: 1200 })
      ),
      -1
    );
  }, [nudge]);

  const arrowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: nudge.value }] }));
  const inactive = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[styles.primary, inactive && styles.primaryInactive]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={styles.row}>
          <Text style={styles.primaryText}>{label}</Text>
          <Animated.View style={arrowStyle}>
            <Feather name={icon} size={20} color="#fff" />
          </Animated.View>
        </View>
      )}
    </PressableScale>
  );
}

export function GoogleButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} style={styles.google} pressedScale={0.97}>
      <AntDesign name="google" size={20} color="#4285F4" />
      <Text style={styles.googleText}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  primary: {
    height: 58,
    borderRadius: 999,
    backgroundColor: Brand.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Brand.greenDark,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  primaryInactive: { opacity: 0.7 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  primaryText: { fontFamily: Font.bold, fontSize: 17, color: '#fff', letterSpacing: 0.2 },
  google: {
    height: 56,
    borderRadius: 999,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: Brand.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleText: { fontFamily: Font.semibold, fontSize: 16, color: Brand.ink },
});
