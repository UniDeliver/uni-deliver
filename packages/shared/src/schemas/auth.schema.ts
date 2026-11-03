import { z } from 'zod';
import { AccountStatus } from '../enums.js';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const registerPushTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;

export const createRiderSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phone: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'Phone number must be valid E.164 format (e.g. +94771234567)'),
  vehicleNo: z.string().trim().min(2, 'Vehicle number is required'),
});

export type CreateRiderInput = z.infer<typeof createRiderSchema>;

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(AccountStatus),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
