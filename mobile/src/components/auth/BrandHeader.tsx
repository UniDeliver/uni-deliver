import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Brand, Font } from '@/theme/brand';
import { enter } from './motion';

interface Props {
  title: string;
  subtitle?: string;
  /** Small amber chip above the title (e.g. "Account Recovery") */
  badge?: { icon: React.ComponentProps<typeof Feather>['name']; label: string };
  titleColor?: string;
}

export function BrandHeader({ title, subtitle, badge, titleColor = Brand.green }: Props) {
  return (
    <View style={styles.wrap}>
      <Animated.View entering={enter(0)} style={styles.logoCard}>
        <Image
          source={require('@/assets/images/unideliver-logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Uni Delivery"
        />
      </Animated.View>

      {badge ? (
        <Animated.View entering={enter(1)} style={styles.badge}>
          <Feather name={badge.icon} size={14} color={Brand.ink} />
          <Text style={styles.badgeText}>{badge.label}</Text>
        </Animated.View>
      ) : null}

      <Animated.Text entering={enter(2)} style={[styles.title, { color: titleColor }]}>
        {title}
      </Animated.Text>
      {subtitle ? (
        <Animated.Text entering={enter(3)} style={styles.subtitle}>
          {subtitle}
        </Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 24 },
  logoCard: {
    backgroundColor: Brand.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
    shadowColor: Brand.greenDark,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  logo: { width: 112, height: 74 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.amberTint,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  badgeText: { fontFamily: Font.semibold, fontSize: 13, color: Brand.ink },
  title: {
    fontFamily: Font.extrabold,
    fontSize: 30,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Font.regular,
    fontSize: 15,
    lineHeight: 22,
    color: Brand.inkSoft,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 320,
  },
});
