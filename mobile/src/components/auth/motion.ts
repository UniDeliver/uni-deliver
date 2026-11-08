import { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Motion } from '@/theme/brand';

/** Staggered entrance for the i-th block on a screen. */
export const enter = (i: number) =>
  FadeInDown.delay(80 + i * Motion.stagger)
    .duration(Motion.enter)
    .springify()
    .damping(Motion.spring.damping)
    .stiffness(Motion.spring.stiffness);

export const enterUp = (i: number) =>
  FadeInUp.delay(80 + i * Motion.stagger)
    .duration(Motion.enter)
    .springify()
    .damping(Motion.spring.damping);
