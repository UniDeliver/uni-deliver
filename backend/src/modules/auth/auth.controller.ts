import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AppError } from '../../utils/errors';

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/** Wraps a service call: body is already validated by validateBody(). */
const handle =
  (fn: (req: Request) => Promise<unknown>, status = 200): Handler =>
  async (req, res, next) => {
    try {
      res.status(status).json({ data: await fn(req) });
    } catch (error) {
      next(error);
    }
  };

export class AuthController {
  /** POST /api/v1/auth/register → { user, token, expiresIn } */
  static register = handle(req => AuthService.register(req.body), 201);

  /** POST /api/v1/auth/login → { user, token, expiresIn } */
  static login = handle(req => AuthService.login(req.body));

  /** POST /api/v1/auth/password/forgot → { message, devCode? } */
  static forgotPassword = handle(req => AuthService.forgotPassword(req.body));

  /** POST /api/v1/auth/password/reset → { user, token, expiresIn } */
  static resetPassword = handle(req => AuthService.resetPassword(req.body));

  /** POST /api/v1/auth/session: Firebase ID token (admin portal, Google sign-in) → { user } */
  static session = handle(async req => {
    if (!req.firebaseUser) {
      throw AppError.unauthenticated('Firebase authentication token required');
    }
    return { user: await AuthService.handleSession(req.firebaseUser) };
  });

  /** GET /api/v1/auth/me → { user }. The mobile app routes by `user.role`. */
  static me = handle(async req => {
    if (!req.user) {
      throw AppError.notFound('User profile not found. Please establish a session first.');
    }
    return { user: AuthService.formatUserResponse(req.user) };
  });
}
