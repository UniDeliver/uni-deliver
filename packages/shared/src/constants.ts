/**
 * Campus drop-off points offered at registration (Stitch "Registration" screen).
 * The `id` is what the API stores in `users.dropOffPoint`.
 */
export const DROP_OFF_POINTS = [
  { id: 'hostel-c', label: 'Hostel Block C' },
  { id: 'main-library', label: 'Main Library Gate' },
  { id: 'applied-sciences', label: 'Applied Sciences Complex' },
  { id: 'cafeteria', label: 'SUSL Main Cafeteria' },
  { id: 'geomatics', label: 'Faculty of Geomatics' },
  { id: 'social-sciences', label: 'Social Sciences & Languages Hub' },
] as const;

export type DropOffPointId = (typeof DROP_OFF_POINTS)[number]['id'];

export const DROP_OFF_POINT_IDS = DROP_OFF_POINTS.map(p => p.id) as [DropOffPointId, ...DropOffPointId[]];

export const PASSWORD_MIN_LENGTH = 8;
export const RESET_CODE_LENGTH = 6;

/**
 * Normalizes a Sri Lankan mobile number to E.164 (+94XXXXXXXXX).
 * Accepts "0771234567", "771234567", "94771234567", "+94 77 123 4567".
 * Returns null if the result is not a valid Sri Lankan mobile number.
 */
export function normalizeSriLankanPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('94')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (!/^7\d{8}$/.test(digits)) return null;
  return `+94${digits}`;
}

/** True if the identifier looks like an email address rather than a phone number. */
export function isEmailIdentifier(identifier: string): boolean {
  return identifier.includes('@');
}
