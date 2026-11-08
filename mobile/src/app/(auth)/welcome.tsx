import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { setStatusBarStyle } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Brand, Font } from '@/theme/brand';
import { PrimaryButton } from '@/components/auth';
import { useSplashDone } from '@/lib/splash-state';

// Must mirror the final frame of AnimatedSplash so the hand-off is seamless.
const SPLASH_LOGO_W = 200;
const SPLASH_LOGO_H = SPLASH_LOGO_W * (341 / 512);
const SPLASH_GAP = 28;
const SPLASH_RADIUS = 28;

const LOGO_W = 136;
const LOGO_H = LOGO_W * (341 / 512);
const LOGO_START_SCALE = SPLASH_LOGO_W / LOGO_W;
const HEADER_PAD_TOP = 20;
const TAGLINE_GAP = 18;

const EASE = Easing.bezier(0.65, 0, 0.35, 1); // same curve as the splash's green circle

// welcome-campus.png is 839x448; its bottom ~48px sit under the rounded action panel.
const ART_ASPECT = 839 / 448;
const ART_OVERLAP = 48 / 448;

/** Sampled from the illustration's sky so the art melts into the sheet with no seam. */
const SHEET_BG = '#FCF9F1';

type FeatureIcon = React.ComponentProps<typeof Feather>['name'];
const FEATURES: { icon: FeatureIcon; label: string }[] = [
  { icon: 'zap', label: 'Fast riders' },
  { icon: 'map-pin', label: 'Hostel drop-off' },
  { icon: 'navigation', label: 'Live tracking' },
];

/**
 * Onboarding. The first frame is identical to the splash's last frame (green field, centred
 * logo card, cream tagline). Once the splash has lifted away, the logo and tagline glide up
 * into a green header and a cream sheet rises with the headline, campus art and actions.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const splashDone = useSplashDone();

  const [rootH, setRootH] = useState(0);
  const [tagH, setTagH] = useState(0);
  const [artSlotH, setArtSlotH] = useState(0);
  const measured = rootH > 0 && tagH > 0;

  // Art fills the width; on short phones its slot shrinks and `cover` trims sky/road evenly.
  const artNaturalH = width / ART_ASPECT;
  const artH = artSlotH > 0 ? Math.min(artSlotH, artNaturalH) : artNaturalH;
  const overlap = Math.round(artNaturalH * ART_OVERLAP);

  // Offsets from the final header layout back to where the splash drew the same elements.
  const splashColTop = rootH / 2 - (SPLASH_LOGO_H + SPLASH_GAP + tagH) / 2;
  const logoDy = splashColTop + SPLASH_LOGO_H / 2 - (insets.top + HEADER_PAD_TOP + LOGO_H / 2);
  const tagDy =
    splashColTop + SPLASH_LOGO_H + SPLASH_GAP + tagH / 2 - (insets.top + HEADER_PAD_TOP + LOGO_H + TAGLINE_GAP + tagH / 2);

  // Light icons on the green header; hand back to default when another screen is on top.
  useFocusEffect(
    React.useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('auto');
    }, [])
  );

  const p = useSharedValue(0);
  const copy = useSharedValue(0);
  const swoosh = useSharedValue(0);
  const art = useSharedValue(0);
  const panel = useSharedValue(0);
  const started = React.useRef(false);

  useEffect(() => {
    if (!measured || !splashDone || started.current) return;
    started.current = true;
    p.value = withDelay(60, withTiming(1, { duration: 720, easing: EASE }));
    // One calm cascade: everything eases out, nothing overshoots.
    const settle = { duration: 420, easing: Easing.out(Easing.cubic) };
    copy.value = withDelay(460, withTiming(1, settle));
    art.value = withDelay(540, withTiming(1, { ...settle, duration: 560 }));
    panel.value = withDelay(620, withTiming(1, settle));
    swoosh.value = withDelay(820, withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }));
  }, [measured, splashDone, p, copy, art, panel, swoosh]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - p.value) * logoDy }, { scale: 1 + (1 - p.value) * (LOGO_START_SCALE - 1) }],
    shadowOpacity: 0.25 - p.value * 0.1,
  }));
  const tagStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - p.value) * tagDy }] }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - p.value) * (rootH || height) }] }));
  const copyStyle = useRiseStyle(copy, 12);
  const sparksStyle = useAnimatedStyle(() => ({ opacity: swoosh.value }));
  const swooshStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: swoosh.value }] }));
  const artStyle = useAnimatedStyle(() => ({
    opacity: art.value,
    transform: [{ translateY: (1 - art.value) * 12 }],
  }));
  const panelStyle = useRiseStyle(panel, 16);

  return (
    <View style={styles.root} onLayout={(e: LayoutChangeEvent) => setRootH(e.nativeEvent.layout.height)}>
      <View style={[styles.header, { paddingTop: insets.top + HEADER_PAD_TOP, opacity: measured ? 1 : 0 }]}>
        <Animated.View style={[styles.logoCard, logoStyle]}>
          <Image
            source={require('@/assets/images/unideliver-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Uni Deliver"
          />
        </Animated.View>
        <Animated.View style={[styles.taglineRow, tagStyle]} onLayout={e => setTagH(e.nativeEvent.layout.height)}>
          <Text style={styles.tagline}>Campus life, delivered</Text>
          <View style={styles.dot} />
        </Animated.View>
      </View>

      <Animated.View style={[styles.sheet, sheetStyle]}>
        <Animated.View style={[styles.headline, copyStyle]} accessible accessibilityRole="header">
          <View style={styles.titleLine}>
            <Animated.View style={[styles.sparks, sparksStyle]} pointerEvents="none">
              <View style={[styles.spark, styles.sparkTop]} />
              <View style={[styles.spark, styles.sparkMid]} />
              <View style={[styles.spark, styles.sparkLow]} />
            </Animated.View>
            <Text style={styles.title}>Everything you need,</Text>
          </View>
          <View style={styles.titleLine}>
            <Text style={styles.title}>from town to </Text>
            <View>
              <Text style={styles.script}>campus</Text>
              <Animated.View style={[styles.swoosh, swooshStyle]} pointerEvents="none">
                <View style={styles.swooshMain} />
                <View style={styles.swooshTail} />
              </Animated.View>
            </View>
          </View>
        </Animated.View>

        {/* Slot flexes on short phones; the art never grows past its natural size */}
        <View
          style={[styles.artSlot, { maxHeight: artNaturalH }]}
          onLayout={e => setArtSlotH(e.nativeEvent.layout.height)}
        >
          <Animated.Image
            source={require('@/assets/images/welcome-campus.png')}
            style={[{ width, height: artH }, artStyle]}
            resizeMode="cover"
            accessibilityLabel="Uni Deliver rider scooting across campus"
          />
        </View>

        <Animated.View
          style={[styles.panel, { marginTop: -overlap, paddingBottom: insets.bottom + 16 }, panelStyle]}
        >
          <View style={styles.features}>
            {FEATURES.map((f, i) => (
              <React.Fragment key={f.label}>
                {i > 0 && <View style={styles.featureDivider} />}
                <View style={styles.feature}>
                  <Feather name={f.icon} size={22} color={Brand.amber} />
                  <Text style={styles.featureText} numberOfLines={1} adjustsFontSizeToFit>
                    {f.label}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <View style={styles.actions}>
            <PrimaryButton label="Get started" onPress={() => router.push('/(auth)/register')} />
            <Pressable onPress={() => router.push('/(auth)/login')} hitSlop={12} style={styles.secondary}>
              <Text style={styles.secondaryText}>I already have an account</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function useRiseStyle(v: SharedValue<number>, distance: number) {
  return useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ translateY: (1 - v.value) * distance }],
  }));
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.green },
  header: { alignItems: 'center', paddingBottom: 28 },
  logoCard: {
    width: LOGO_W,
    height: LOGO_H,
    borderRadius: SPLASH_RADIUS / LOGO_START_SCALE,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowRadius: 24 / LOGO_START_SCALE,
    shadowOffset: { width: 0, height: 12 / LOGO_START_SCALE },
    zIndex: 2,
  },
  logo: { width: LOGO_W, height: LOGO_H, borderRadius: SPLASH_RADIUS / LOGO_START_SCALE },
  // Same type as the splash tagline so it carries straight over
  taglineRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: TAGLINE_GAP },
  tagline: { fontFamily: Font.extrabold, fontSize: 22, color: Brand.cream, letterSpacing: -0.4 },
  dot: { width: 7, height: 7, borderRadius: 1.5, backgroundColor: Brand.amber, marginLeft: 2, marginBottom: 6 },

  sheet: {
    flex: 1,
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 32,
    overflow: 'hidden',
  },

  headline: { alignItems: 'center', paddingHorizontal: 24 },
  titleLine: { flexDirection: 'row', alignItems: 'flex-end' },
  title: {
    fontFamily: Font.extrabold,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.7,
    color: Brand.green,
  },
  script: {
    fontFamily: Font.script,
    fontSize: 36,
    lineHeight: 36,
    color: Brand.green,
    marginBottom: -1,
  },
  // Three amber strokes "radiating" off the top-left of the headline
  sparks: { position: 'absolute', left: -30, top: -10, width: 28, height: 28 },
  spark: { position: 'absolute', width: 4, borderRadius: 2, backgroundColor: Brand.amber },
  sparkTop: { height: 14, left: 18, top: 0, transform: [{ rotate: '20deg' }] },
  sparkMid: { height: 14, left: 7, top: 6, transform: [{ rotate: '-35deg' }] },
  sparkLow: { height: 12, left: 4, top: 18, transform: [{ rotate: '-80deg' }] },
  // Hand-drawn underline: a long tilted stroke plus a short return flick, drawn left to right
  swoosh: { position: 'absolute', left: -12, right: -6, bottom: -10, height: 12, transformOrigin: 'left' },
  swooshMain: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.amber,
    transform: [{ rotate: '-4deg' }],
  },
  swooshTail: {
    position: 'absolute',
    left: '30%',
    width: '45%',
    top: 9,
    height: 3,
    borderRadius: 2,
    backgroundColor: Brand.amber,
    transform: [{ rotate: '-2deg' }],
  },

  artSlot: { flex: 1, marginTop: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },

  panel: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  features: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 28,
    backgroundColor: Brand.surface,
    shadowColor: '#5A4A1E',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  feature: { flex: 1, alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  featureText: { fontFamily: Font.medium, fontSize: 14, color: Brand.inkSoft, textAlign: 'center' },
  featureDivider: { width: 1, height: 40, backgroundColor: Brand.border },
  actions: { marginTop: 28, gap: 20 },
  secondary: { alignSelf: 'center', paddingVertical: 4 },
  secondaryText: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: Brand.green,
    textDecorationLine: 'underline',
  },
});
