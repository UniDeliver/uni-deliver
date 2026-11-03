import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AppError } from '../../utils/errors';

export class AuthController {
  /**
   * POST /api/v1/auth/session
   * Authenticates/links user from verified Firebase Bearer token and returns user contract
   */
  static async session(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.firebaseUser) {
        throw AppError.unauthenticated('Firebase authentication token required');
      }

      const user = await AuthService.handleSession(req.firebaseUser);
      res.status(200).json({
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   * Returns current user + role (used by mobile and admin for routing)
   * As per architecture.md Section 7.3: suspended users can access GET /auth/me to view their account state
   */
  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.firebaseUser) {
        throw AppError.unauthenticated('Firebase authentication token required');
      }

      const user = await AuthService.getCurrentUser(req.firebaseUser);
      res.status(200).json({
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
