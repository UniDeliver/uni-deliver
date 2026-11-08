import { Easing, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Motion } from '@/theme/brand';

const settle = Easing.out(Easing.cubic);

/** Staggered entrance for the i-th block on a screen: a short fade + drift, no spring overshoot. */
export const enter = (i: number) =>
  FadeInDown.delay(60 + i * Motion.stagger)
    .duration(Motion.enter)
    .easing(settle);

export const enterUp = (i: number) =>
  FadeInUp.delay(60 + i * Motion.stagger)
    .duration(Motion.enter)
    .easing(settle);
