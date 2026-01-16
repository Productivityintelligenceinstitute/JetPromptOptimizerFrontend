/**
 * Custom error types for better error handling and type safety
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication failed', details?: unknown) {
    super(message, 401, 'AUTH_ERROR', details);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class UserNotFoundError extends ApiError {
  constructor(message: string = 'User not found', details?: unknown) {
    super(message, 404, 'USER_NOT_FOUND', details);
    this.name = 'UserNotFoundError';
    Object.setPrototypeOf(this, UserNotFoundError.prototype);
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network request failed', public readonly originalError?: unknown) {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export type ErrorHandler = (error: unknown) => void;

