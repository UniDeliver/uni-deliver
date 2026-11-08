import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Brand, Font } from '@/theme/brand';
import { PrimaryButton, enter, enterUp } from '@/components/auth';

/** Stitch: "Uni Deliver - Onboarding" */
export default function WelcomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const heroSize = Math.min(width * 0.74, height * 0.36, 320);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Animated.View entering={enter(0)} style={styles.logoWrap}>
          <Image
            source={require('@/assets/images/unideliver-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Uni Delivery"
          />
        </Animated.View>

        <View style={styles.headline}>
          <Animated.Text entering={enter(1)} style={styles.headlineText}>
            Campus life,
          </Animated.Text>
          <View style={styles.headlineRow}>
            <Animated.Text entering={enter(2)} style={styles.headlineText}>
              delivered
            </Animated.Text>
            <Animated.View entering={ZoomIn.delay(520).springify().damping(9)} style={styles.dot} />
          </View>
        </View>

        <Hero size={heroSize} />

        <Animated.Text entering={enter(5)} style={styles.subtitle}>
          Food and essentials from{'\n'}town to campus.
        </Animated.Text>

        <Animated.View entering={enterUp(6)} style={styles.actions}>
          <PrimaryButton label="Get started" onPress={() => router.push('/(auth)/register')} />
          <Pressable onPress={() => router.push('/(auth)/login')} hitSlop={12} style={styles.secondary}>
            <Text style={styles.secondaryText}>I already have an account</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

/** Food photo in a soft circle that floats, with amber "sun rays" that pulse. */
function Hero({ size }: { size: number }) {
  const float = useSharedValue(0);
  const rays = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
    rays.value = withDelay(
      700,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }),
          withTiming(0.35, { duration: 900, easing: Easing.in(Easing.quad) })
        ),
        -1
      )
    );
  }, [float, rays]);

  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));
  const raysStyle = useAnimatedStyle(() => ({
    opacity: rays.value,
    transform: [{ scale: 0.92 + rays.value * 0.08 }],
  }));

  return (
    <View style={[styles.heroArea, { height: size + 24 }]}>
      <Animated.View entering={ZoomIn.delay(260).springify().damping(14)} style={floatStyle}>
        <View style={[styles.heroHalo, { width: size, height: size, borderRadius: size / 2 }]}>
          <Image
            source={require('@/assets/images/onboarding-hero.png')}
            style={{ width: size - 16, height: size - 16, borderRadius: (size - 16) / 2 }}
            resizeMode="cover"
            accessibilityLabel="Burger and fries"
          />
        </View>
        <Animated.View
          entering={FadeIn.delay(700)}
          style={[styles.rays, { top: size * 0.02, right: -size * 0.06 }, raysStyle]}
          pointerEvents="none"
        >
          <View style={[styles.ray, { transform: [{ rotate: '-55deg' }] }]} />
          <View style={[styles.ray, { transform: [{ rotate: '-20deg' }], marginLeft: 18, marginTop: 8 }]} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF7F0' },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  logoWrap: { marginTop: 12 },
  logo: { width: 120, height: 80 },
  headline: { alignItems: 'center' },
  headlineRow: { flexDirection: 'row', alignItems: 'flex-end' },
  headlineText: {
    fontFamily: Font.extrabold,
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: -1.4,
    color: '#083E2D',
    textAlign: 'center',
  },
  dot: { width: 12, height: 12, backgroundColor: Brand.amber, marginLeft: 3, marginBottom: 9, borderRadius: 2 },
  heroArea: { alignItems: 'center', justifyContent: 'center' },
  heroHalo: {
    backgroundColor: '#FDE7B8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8A5A00',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  rays: { position: 'absolute' },
  ray: { width: 8, height: 26, borderRadius: 4, backgroundColor: Brand.amber },
  subtitle: {
    fontFamily: Font.regular,
    fontSize: 17,
    lineHeight: 25,
    color: '#24282B',
    textAlign: 'center',
  },
  actions: { alignSelf: 'stretch', gap: 14 },
  secondary: { alignSelf: 'center', paddingVertical: 4 },
  secondaryText: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: '#083E2D',
    textDecorationLine: 'underline',
  },
});
