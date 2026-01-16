/**
 * Centralized error handling utilities
 */

import { AxiosError } from 'axios';
import { ApiError, AuthenticationError, UserNotFoundError, NetworkError } from '@/shared/types/errors';

/**
 * Checks if an error is a network error (no response from server)
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof NetworkError) return true;
  if (error instanceof AxiosError) {
    return !error.response && error.request;
  }
  return false;
};

/**
 * Checks if an error is retryable (transient failures)
 */
export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof ApiError) {
    // Retry on 5xx errors and network errors
    return !error.statusCode || (error.statusCode >= 500 && error.statusCode < 600);
  }
  return isNetworkError(error);
};

/**
 * Converts various error types to ApiError
 */
export const normalizeError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof AxiosError) {
    const statusCode = error.response?.status;
    const message = error.response?.data?.detail || error.message || 'Request failed';
    
    if (statusCode === 401) {
      return new AuthenticationError(message, error.response?.data);
    }
    
    if (statusCode === 404) {
      return new UserNotFoundError(message, error.response?.data);
    }

    if (!error.response) {
      return new NetworkError('Network request failed', error);
    }

    return new ApiError(message, statusCode, error.code, error.response?.data);
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError('An unexpected error occurred', undefined, 'UNKNOWN_ERROR', error);
};

/**
 * Safe error logging with context
 */
export const logError = (error: unknown, context?: string): void => {
  const normalizedError = normalizeError(error);
  const logContext = context ? `[${context}]` : '';
  
  console.error(`${logContext} ${normalizedError.name}:`, {
    message: normalizedError.message,
    statusCode: normalizedError.statusCode,
    code: normalizedError.code,
    details: normalizedError.details,
  });
};

