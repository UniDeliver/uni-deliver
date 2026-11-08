import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/unideliver_dev'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:8081,http://localhost:19006'),
  DEV_AUTH_BYPASS: z.string().optional().transform(val => val === 'true'),
  JWT_SECRET: z.string().min(16).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

if (parsed.data.NODE_ENV === 'production' && !parsed.data.JWT_SECRET) {
  console.error('JWT_SECRET must be set in production.');
  process.exit(1);
}

export const env = {
  ...parsed.data,
  JWT_SECRET: parsed.data.JWT_SECRET ?? 'unideliver-dev-only-jwt-secret-change-me',
};
