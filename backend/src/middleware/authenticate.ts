import { Request, Response, NextFunction } from 'express';
import { firebaseAuth, hasLiveFirebaseCredentials } from '../config/firebase';
import { env } from '../config/env';
import { UserModel, IUser } from '../models/user.model';
import { AppError } from '../utils/errors';

export interface DecodedFirebaseUser {
  uid: string;
  phone_number?: string;
  email?: string;
  name?: string;
  [key: string]: any;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser | null;
      firebaseUser?: DecodedFirebaseUser;
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(AppError.unauthenticated('Missing or malformed Authorization header'));
  }

  const token = authHeader.split('Bearer ')[1].trim();

  try {
    let decodedToken: DecodedFirebaseUser;

    // Support dev bypass token if enabled or during testing when live credentials are not set
    if (env.DEV_AUTH_BYPASS && token.startsWith('dev:')) {
      // Format: dev:<uid>:<phone>:<role>
      const parts = token.split(':');
      decodedToken = {
        uid: parts[1] || 'dev-user-uid',
        phone_number: parts[2] || '+94770000000',
        email: parts[3] ? `${parts[3]}@unideliver.test` : undefined,
      };
    } else {
      if (!hasLiveFirebaseCredentials && env.NODE_ENV === 'development') {
        // If developer hasn't set Firebase service account keys yet in .env, accept dev token or mock decode
        if (token.startsWith('dev-')) {
          decodedToken = {
            uid: token,
            phone_number: '+94771234567',
          };
        } else {
          try {
            decodedToken = await firebaseAuth.verifyIdToken(token);
          } catch (err: any) {
            // Friendly message in local development
            return next(
              AppError.unauthenticated(
                'Invalid Firebase ID token. (Note: To test locally without live Firebase keys, set DEV_AUTH_BYPASS=true and use token "dev:<uid>:<phone>").'
              )
            );
          }
        }
      } else {
        decodedToken = await firebaseAuth.verifyIdToken(token);
      }
    }

    req.firebaseUser = decodedToken;

    // Load user from MongoDB
    const user = await UserModel.findOne({ firebaseUid: decodedToken.uid });
    req.user = user;

    next();
  } catch (error: any) {
    console.error('[Auth Middleware] Verification error:', error?.message || error);
    next(AppError.unauthenticated('Invalid or expired authentication token'));
  }
}

/**
 * Middleware for optional authentication. Does not fail if header is missing,
 * but populates req.user if a valid token is provided.
 */
export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  return authenticate(req, _res, next);
}
