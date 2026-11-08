/**
 * Uni Deliver brand tokens, taken from the Stitch auth screens
 * (project 15844911321149223708: Onboarding, Login, Registration, Forgot Password).
 */
export const Brand = {
  green: '#0B4632',
  greenDark: '#002E1F',
  greenMid: '#005640',
  greenTint: '#C8F0D2',
  amber: '#F5A623',
  amberDeep: '#EA9600',
  amberTint: '#FDE3C0',
  cream: '#FBF9F4',
  creamDeep: '#F0EEEA',
  surface: '#FFFFFF',
  border: '#E3E1DB',
  borderFocus: '#0B4632',
  ink: '#1B1C19',
  inkSoft: '#5B5E57',
  inkMuted: '#9A9C95',
  danger: '#C62828',
  dangerTint: '#FDECEA',
  success: '#1E7A46',
  successTint: '#DDF5E4',
} as const;

export const Font = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const Radius = {
  field: 999,
  card: 20,
  pill: 999,
} as const;

/** Shared motion timings so every screen feels the same. */
export const Motion = {
  stagger: 70,
  enter: 420,
  spring: { damping: 16, stiffness: 180, mass: 0.9 },
  press: { damping: 18, stiffness: 400 },
} as const;
