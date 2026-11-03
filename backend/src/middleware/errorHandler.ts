import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // If it's already an AppError
  if (err instanceof AppError) {
    res.status(err.httpStatus).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: `A record with this ${field} already exists.`,
        details: err.keyValue,
      },
    });
    return;
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err?.name === 'CastError') {
    res.status(400).json({
      error: {
        code: 'INVALID_ID',
        message: `Invalid identifier format: ${err.value}`,
        details: null,
      },
    });
    return;
  }

  console.error('[Unhandled Error]', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL',
      message: 'Internal server error occurred.',
      details: process.env.NODE_ENV === 'development' ? err?.message : null,
    },
  });
}
