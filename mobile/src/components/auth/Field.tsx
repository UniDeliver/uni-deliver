import React, { forwardRef, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Brand, Font } from '@/theme/brand';

type IconName = React.ComponentProps<typeof Feather>['name'];

export interface FieldProps extends TextInputProps {
  label?: string;
  required?: boolean;
  icon?: IconName;
  error?: string | null;
  /** Shown on the right of the label row, e.g. a promo chip or "Forgot password?" link */
  labelAccessory?: React.ReactNode;
  /** Rendered inside the field before the input, e.g. a +94 prefix */
  prefix?: React.ReactNode;
  /** Password field with show/hide toggle */
  secureToggle?: boolean;
  /** Show an × button that clears the text */
  clearable?: boolean;
  hint?: string;
}

/** Rounded text field with animated focus ring and an error shake. */
export const Field = forwardRef<TextInput, FieldProps>(function Field(
  {
    label,
    required,
    icon,
    error,
    labelAccessory,
    prefix,
    secureToggle,
    clearable,
    hint,
    onFocus,
    onBlur,
    style,
    ...inputProps
  },
  ref
) {
  const [hidden, setHidden] = useState(true);
  const focus = useSharedValue(0);
  const shake = useSharedValue(0);
  const hasError = Boolean(error);

  useEffect(() => {
    if (hasError) {
      shake.value = withSequence(
        withTiming(-7, { duration: 45 }),
        withTiming(7, { duration: 45 }),
        withTiming(-5, { duration: 45 }),
        withTiming(5, { duration: 45 }),
        withTiming(0, { duration: 45 })
      );
    }
  }, [error, hasError, shake]);

  const boxStyle = useAnimatedStyle(() => ({
    borderColor: hasError
      ? Brand.danger
      : interpolateColor(focus.value, [0, 1], [Brand.border, Brand.borderFocus]),
    borderWidth: 1 + focus.value * 0.5,
    shadowOpacity: focus.value * 0.12,
    transform: [{ translateX: shake.value }],
  }));

  return (
    <View style={styles.wrap}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            {label}
            {required ? <Text style={styles.required}> *</Text> : null}
          </Text>
          {labelAccessory}
        </View>
      ) : null}

      <Animated.View style={[styles.box, boxStyle]}>
        {icon ? (
          <Feather name={icon} size={20} color={hasError ? Brand.danger : Brand.inkSoft} style={styles.icon} />
        ) : null}
        {prefix}
        <TextInput
          ref={ref}
          placeholderTextColor={Brand.inkMuted}
          selectionColor={Brand.green}
          secureTextEntry={secureToggle ? hidden : inputProps.secureTextEntry}
          onFocus={e => {
            focus.value = withTiming(1, { duration: 180 });
            onFocus?.(e);
          }}
          onBlur={e => {
            focus.value = withTiming(0, { duration: 180 });
            onBlur?.(e);
          }}
          style={[styles.input, style]}
          {...inputProps}
        />
        {secureToggle ? (
          <Pressable
            onPress={() => setHidden(h => !h)}
            hitSlop={12}
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Feather name={hidden ? 'eye-off' : 'eye'} size={20} color={Brand.inkMuted} />
          </Pressable>
        ) : null}
        {clearable && inputProps.value ? (
          <Pressable
            onPress={() => inputProps.onChangeText?.('')}
            hitSlop={10}
            style={styles.clear}
            accessibilityLabel="Clear"
          >
            <Feather name="x" size={16} color={Brand.inkSoft} />
          </Pressable>
        ) : null}
      </Animated.View>

      {hasError ? (
        <Animated.Text entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={styles.error}>
          {error}
        </Animated.Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  label: { fontFamily: Font.semibold, fontSize: 14, color: Brand.ink },
  required: { color: Brand.danger },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: Brand.surface,
    paddingHorizontal: 18,
    shadowColor: Brand.green,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  icon: { marginRight: 12 },
  input: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 16,
    color: Brand.ink,
    paddingVertical: 14,
  },
  clear: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Brand.creamDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { fontFamily: Font.medium, fontSize: 12.5, color: Brand.danger, marginTop: 6, paddingHorizontal: 6 },
  hint: { fontFamily: Font.regular, fontSize: 12.5, color: Brand.inkSoft, marginTop: 6, paddingHorizontal: 6 },
});
