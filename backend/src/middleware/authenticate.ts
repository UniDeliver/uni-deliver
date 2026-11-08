import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { firebaseAuth, hasLiveFirebaseCredentials } from '../config/firebase';
import { env } from '../config/env';
import { UserModel, IUser } from '../models/user.model';
import { AppError } from '../utils/errors';

// Kept here (not imported from auth.service) to avoid a circular import
const JWT_ISSUER = 'unideliver-api';

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

/** Returns the user id (`sub`) if this is a valid backend-issued JWT, otherwise null. */
function verifyBackendToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { issuer: JWT_ISSUER });
    return typeof payload === 'object' && payload.sub ? payload.sub : null;
  } catch {
    return null; // not ours (e.g. a Firebase ID token) or expired
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
    // 1. Backend-issued session JWT (mobile email/phone + password login).
    //    The user is loaded by id; the role always comes from MongoDB, never the token.
    const backendSubject = verifyBackendToken(token);
    if (backendSubject) {
      req.user = await UserModel.findById(backendSubject);
      if (!req.user) {
        return next(AppError.unauthenticated('Account no longer exists'));
      }
      return next();
    }

    let decodedToken: DecodedFirebaseUser | null = null;

    // 2. Support dev bypass token if enabled
    if (!decodedToken && (env.DEV_AUTH_BYPASS || env.NODE_ENV === 'development') && token.startsWith('dev:')) {
      const parts = token.split(':');
      decodedToken = {
        uid: parts[1] || 'dev-user-uid',
        phone_number: parts[2] || '+94770000000',
        email: parts[3] ? `${parts[3]}@unideliver.test` : undefined,
      };
    }

    // 3. Dev convenience mock token
    if (!decodedToken && !hasLiveFirebaseCredentials && env.NODE_ENV === 'development' && token.startsWith('dev-')) {
      decodedToken = {
        uid: token,
        phone_number: '+94771234567',
      };
    }

    // 4. Verify Firebase ID Token
    if (!decodedToken) {
      decodedToken = await firebaseAuth.verifyIdToken(token);
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
