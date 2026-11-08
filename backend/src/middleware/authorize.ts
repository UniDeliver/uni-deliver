import { Request, Response, NextFunction } from 'express';
import { Role, AccountStatus } from '@unideliver/shared';
import { AppError } from '../utils/errors';

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      return next(AppError.unauthenticated('User not found or unauthenticated'));
    }

    // Suspended users receive 403 ACCOUNT_SUSPENDED
    if (user.status === AccountStatus.SUSPENDED) {
      return next(AppError.accountSuspended('Your account has been suspended. Please contact support.'));
    }

    // Role-level check
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return next(AppError.forbidden(`Forbidden: Access requires one of [${allowedRoles.join(', ')}] role`));
    }

    next();
  };
}
