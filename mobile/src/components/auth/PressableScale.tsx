import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Motion } from '@/theme/brand';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** How far to shrink on press (default 0.96). */
  pressedScale?: number;
}

/** Pressable that springs down on touch and back on release. */
export function PressableScale({ style, pressedScale = 0.96, onPressIn, onPressOut, children, ...rest }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...rest}
      onPressIn={e => {
        scale.value = withSpring(pressedScale, Motion.press);
        onPressIn?.(e);
      }}
      onPressOut={e => {
        scale.value = withSpring(1, Motion.press);
        onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
