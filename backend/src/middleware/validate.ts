import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/errors';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        next(AppError.validationError('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        next(AppError.validationError('Invalid query parameters', details));
      } else {
        next(error);
      }
    }
  };
}
