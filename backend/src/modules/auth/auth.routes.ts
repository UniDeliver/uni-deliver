import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { validateBody } from '../../middleware/validate';
import { rateLimit, byIdentifier } from '../../middleware/rateLimit';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@unideliver/shared';

const router = Router();

const FIFTEEN_MIN = 15 * 60 * 1000;
// Per IP: a loose cap (campus Wi-Fi shares IPs). Per IP + account: the real brute-force limit.
const ipLimiter = rateLimit({ name: 'auth-ip', windowMs: FIFTEEN_MIN, max: 200 });
const loginLimiter = rateLimit({ name: 'login', windowMs: FIFTEEN_MIN, max: 10, keyBy: byIdentifier });
const registerLimiter = rateLimit({ name: 'register', windowMs: FIFTEEN_MIN, max: 20 });
const forgotLimiter = rateLimit({ name: 'forgot', windowMs: FIFTEEN_MIN, max: 5, keyBy: byIdentifier });
// Wrong codes are also capped per code (5 attempts) in AuthService
const resetLimiter = rateLimit({ name: 'reset', windowMs: FIFTEEN_MIN, max: 15, keyBy: byIdentifier });

router.use(ipLimiter);

// Public: credential auth (mobile)
router.post('/register', registerLimiter, validateBody(registerSchema), AuthController.register);
router.post('/login', loginLimiter, validateBody(loginSchema), AuthController.login);
router.post('/password/forgot', forgotLimiter, validateBody(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/password/reset', resetLimiter, validateBody(resetPasswordSchema), AuthController.resetPassword);

// Firebase ID token → create/link Mongo user (admin portal, Google sign-in)
router.post('/session', authenticate, AuthController.session);

// Any authenticated user, including suspended accounts (Section 7.3)
router.get('/me', authenticate, AuthController.me);

export default router;
