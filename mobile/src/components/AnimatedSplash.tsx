import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Brand, Font } from '@/theme/brand';

const LOGO_WIDTH = 200;
const LOGO_HEIGHT = LOGO_WIDTH * (341 / 512);
const MIN_VISIBLE_MS = 1700;

interface Props {
  /** True once fonts are loaded and the saved session has been checked with the server. */
  ready: boolean;
  onFinish: () => void;
  /**
   * 'lift' (default): logo dips and the overlay zooms away to reveal the app.
   * 'dissolve': the next screen starts on this exact frame (welcome), so only the speed lines
   * fade out and the overlay is then removed at full opacity. Fading the whole overlay over an
   * identical screen doubles shadows and dims the frame for a moment.
   */
  exit?: 'lift' | 'dissolve';
}

/**
 * Picks up exactly where the native splash (logo on white, see app.json) leaves off:
 *   1. logo pops while a green circle grows from behind it to fill the screen
 *   2. tagline rises in, amber speed lines streak past the logo while we wait
 *   3. once `ready`, the logo dips and the whole overlay lifts away to reveal the app
 */
export function AnimatedSplash({ ready, onFinish, exit: exitMode = 'lift' }: Props) {
  const { width, height } = useWindowDimensions();
  const circleSize = Math.hypot(width, height) * 1.1;

  const [introDone, setIntroDone] = useState(false);
  const logoScale = useSharedValue(1);
  const circle = useSharedValue(0);
  const tagline = useSharedValue(0);
  const speed = useSharedValue(0);
  const exit = useSharedValue(0);
  const linesOut = useSharedValue(0);

  const started = useRef(false);

  const startIntro = () => {
    if (started.current) return; // onLayout also fires on rotation
    started.current = true;
    SplashScreen.hideAsync().catch(() => {});

    logoScale.value = withSequence(
      withTiming(1.08, { duration: 220, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 9, stiffness: 160 })
    );
    circle.value = withDelay(120, withTiming(1, { duration: 650, easing: Easing.bezier(0.65, 0, 0.35, 1) }));
    tagline.value = withDelay(620, withSpring(1, { damping: 14, stiffness: 140 }));
    speed.value = withDelay(
      750,
      withRepeat(withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }), -1, false)
    );
  };

  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), MIN_VISIBLE_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready || !introDone) return;
    if (exitMode === 'dissolve') {
      linesOut.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }, finished => {
        if (finished) runOnJS(onFinish)();
      });
      return;
    }
    logoScale.value = withSequence(
      withTiming(0.92, { duration: 140 }),
      withTiming(1.25, { duration: 420, easing: Easing.in(Easing.cubic) })
    );
    exit.value = withDelay(
      140,
      withTiming(1, { duration: 420, easing: Easing.in(Easing.cubic) }, finished => {
        if (finished) runOnJS(onFinish)();
      })
    );
  }, [ready, introDone, exit, linesOut, exitMode, logoScale, onFinish]);

  const zoomOnExit = exitMode === 'lift';
  const containerStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ scale: zoomOnExit ? 1 + exit.value * 0.08 : 1 }],
  }));
  const linesStyle = useAnimatedStyle(() => ({ opacity: 1 - linesOut.value }));
  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: circle.value }] }));
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    // card shadow appears as the green arrives
    shadowOpacity: circle.value * 0.25,
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: tagline.value,
    transform: [{ translateY: (1 - tagline.value) * 18 }],
  }));
  return (
    <Animated.View style={[styles.root, containerStyle]} onLayout={startIntro} pointerEvents="none">
      <Animated.View
        style={[
          styles.circle,
          { width: circleSize, height: circleSize, borderRadius: circleSize / 2 },
          circleStyle,
        ]}
      />

      <View style={styles.center}>
        <View style={styles.logoRow}>
          <Animated.View style={[styles.speedLines, linesStyle]}>
            <SpeedLine progress={speed} offset={0} width={34} />
            <SpeedLine progress={speed} offset={0.33} width={22} />
            <SpeedLine progress={speed} offset={0.66} width={28} />
          </Animated.View>
          <Animated.View style={[styles.logoCard, logoStyle]}>
            <Image
              source={require('@/assets/images/unideliver-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        <Animated.View style={[styles.taglineRow, taglineStyle]}>
          <Animated.Text style={styles.tagline}>Campus life, delivered</Animated.Text>
          <View style={styles.dot} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

/** Amber dash that streaks left out of the scooter, offset in phase from its siblings. */
function SpeedLine({ progress, offset, width }: { progress: SharedValue<number>; offset: number; width: number }) {
  const style = useAnimatedStyle(() => {
    const p = (progress.value + offset) % 1;
    return {
      opacity: progress.value === 0 ? 0 : Math.sin(p * Math.PI),
      transform: [{ translateX: -40 - p * 60 }],
    };
  });
  return <Animated.View style={[styles.speedLine, { width }, style]} />;
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 999,
  },
  circle: { position: 'absolute', backgroundColor: Brand.green },
  center: { alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  speedLines: { position: 'absolute', left: 0, gap: 10, alignItems: 'flex-end' },
  speedLine: { height: 5, borderRadius: 3, backgroundColor: Brand.amber },
  logoCard: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    overflow: 'visible',
    shadowColor: '#000',
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  logo: { width: LOGO_WIDTH, height: LOGO_HEIGHT, borderRadius: 28 },
  taglineRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 28 },
  tagline: { fontFamily: Font.extrabold, fontSize: 22, color: Brand.cream, letterSpacing: -0.4 },
  dot: { width: 7, height: 7, borderRadius: 1.5, backgroundColor: Brand.amber, marginLeft: 2, marginBottom: 6 },
});
