import type { ZodType } from 'zod';
import { ApiError } from '@/api/client';

export type FieldErrors = Record<string, string>;

/** Validates with a shared zod schema; returns the first message per field, or null if valid. */
export function validate(schema: ZodType, values: unknown): FieldErrors | null {
  const result = schema.safeParse(values);
  if (result.success) return null;
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_form';
    errors[key] ??= issue.message;
  }
  return errors;
}

/**
 * Turns an API error into { fieldErrors, formError }.
 * VALIDATION_ERROR details map onto fields; everything else becomes a banner message.
 */
export function fromApiError(err: unknown): { fieldErrors: FieldErrors; formError: string | null } {
  if (err instanceof ApiError) {
    if (err.code === 'VALIDATION_ERROR' && Array.isArray(err.details)) {
      const fieldErrors: FieldErrors = {};
      for (const d of err.details as { path: string; message: string }[]) {
        fieldErrors[d.path] ??= d.message;
      }
      return { fieldErrors, formError: null };
    }
    return { fieldErrors: {}, formError: err.message };
  }
  return {
    fieldErrors: {},
    formError: "Can't reach Uni Deliver right now. Check your connection and try again.",
  };
}
