import { z } from 'zod';
import { AccountStatus } from '../enums.js';
import {
  DROP_OFF_POINT_IDS,
  PASSWORD_MIN_LENGTH,
  RESET_CODE_LENGTH,
  isEmailIdentifier,
  normalizeSriLankanPhone,
} from '../constants.js';

const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address');

const phoneSchema = z
  .string()
  .trim()
  .transform((val, ctx) => {
    const normalized = normalizeSriLankanPhone(val);
    if (!normalized) {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid Sri Lankan mobile number (07X XXX XXXX)' });
      return z.NEVER;
    }
    return normalized;
  });

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(128, 'Password is too long');

/** Email address or Sri Lankan mobile number. */
const identifierSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email or mobile number')
  .superRefine((val, ctx) => {
    if (isEmailIdentifier(val)) {
      if (!emailSchema.safeParse(val).success) {
        ctx.addIssue({ code: 'custom', message: 'Enter a valid email address' });
      }
    } else if (!normalizeSriLankanPhone(val)) {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid email or mobile number (07X XXX XXXX)' });
    }
  });

// ── Auth ──────────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: emailSchema,
    phone: phoneSchema,
    dropOffPoint: z.enum(DROP_OFF_POINT_IDS, { message: 'Select a drop-off point' }),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { message: 'You must accept the Campus Delivery Terms' }),
  })
  .refine(d => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type RegisterInput = z.input<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, 'Enter your password'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.input<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  identifier: identifierSchema,
});

export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    identifier: identifierSchema,
    code: z.string().trim().regex(new RegExp(`^\\d{${RESET_CODE_LENGTH}}$`), `Enter the ${RESET_CODE_LENGTH}-digit code`),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(d => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;

// ── Profile ───────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  dropOffPoint: z.enum(DROP_OFF_POINT_IDS).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const registerPushTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;

// ── Admin ─────────────────────────────────────────────────────────────

export const createRiderSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phone: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'Phone number must be valid E.164 format (e.g. +94771234567)'),
  vehicleNo: z.string().trim().min(2, 'Vehicle number is required'),
  /** Optional initial password. If omitted, the rider sets one with "Forgot password". */
  password: passwordSchema.optional(),
});

export type CreateRiderInput = z.infer<typeof createRiderSchema>;

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(AccountStatus),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
