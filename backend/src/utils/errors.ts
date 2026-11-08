export class AppError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;
  public readonly details: unknown;

  constructor(code: string, httpStatus: number, message: string, details: unknown = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static unauthenticated(message = 'Authentication required'): AppError {
    return new AppError('UNAUTHENTICATED', 401, message);
  }

  static badRequest(message = 'Bad request', details: unknown = null): AppError {
    return new AppError('BAD_REQUEST', 400, message, details);
  }

  static invalidCredentials(message = 'Incorrect email/phone or password.'): AppError {
    return new AppError('INVALID_CREDENTIALS', 401, message);
  }

  static forbidden(message = 'Access forbidden'): AppError {
    return new AppError('FORBIDDEN', 403, message);
  }

  static accountSuspended(message = 'Account is suspended. Please contact support.'): AppError {
    return new AppError('ACCOUNT_SUSPENDED', 403, message);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError('NOT_FOUND', 404, message);
  }

  static validationError(message = 'Validation failed', details: unknown = null): AppError {
    return new AppError('VALIDATION_ERROR', 422, message, details);
  }

  static conflict(code: string, message: string): AppError {
    return new AppError(code, 409, message);
  }

  static tooManyRequests(message = 'Too many requests. Please try again later.'): AppError {
    return new AppError('RATE_LIMITED', 429, message);
  }

  static internal(message = 'An unexpected internal error occurred'): AppError {
    return new AppError('INTERNAL', 500, message);
  }
}
