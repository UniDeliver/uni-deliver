import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

// POST /api/v1/auth/session - Any signed-in Firebase user
router.post('/session', authenticate, AuthController.session);

// GET /api/v1/auth/me - Any authenticated user (including suspended accounts per Section 7.3)
router.get('/me', authenticate, AuthController.me);

export default router;
