import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

interface RateLimitOptions {
  name: string;
  windowMs: number;
  max: number;
  /**
   * Extra key part, e.g. the login identifier. Many students share one campus IP (NAT),
   * so per-account keys stop one person's typos from locking out a whole hostel.
   */
  keyBy?: (req: Request) => string | undefined;
}

/**
 * Minimal in-memory fixed-window rate limiter (SR09).
 * Per process only; swap for express-rate-limit with a shared store when running several instances.
 */
export function rateLimit({ name, windowMs, max, keyBy }: RateLimitOptions) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, _res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = `${name}:${req.ip}:${keyBy?.(req) ?? ''}`;
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
      }
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      const minutes = Math.ceil((entry.resetAt - now) / 60_000);
      return next(AppError.tooManyRequests(`Too many attempts. Try again in ${minutes} minute(s).`));
    }
    next();
  };
}

/** Keys by the request's login identifier (email/phone, digits only for phones). */
export const byIdentifier = (req: Request): string | undefined => {
  const id = req.body?.identifier;
  if (typeof id !== 'string') return undefined;
  return id.includes('@') ? id.trim().toLowerCase() : id.replace(/\D/g, '').slice(-9);
};
