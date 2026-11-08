import { randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual, createHash } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const KEY_LENGTH = 64;

/** Hashes a password with scrypt. Stored format: `scrypt$<saltHex>$<hashHex>` */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;
  const [algo, saltHex, hashHex] = stored.split('$');
  if (algo !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Random numeric code, e.g. "042917". */
export function generateNumericCode(length: number): string {
  return randomInt(0, 10 ** length).toString().padStart(length, '0');
}

/** SHA-256 for short-lived codes (attempt-limited, so a fast hash is fine). */
export function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export function codesMatch(code: string, storedHash: string): boolean {
  const a = Buffer.from(hashCode(code), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
