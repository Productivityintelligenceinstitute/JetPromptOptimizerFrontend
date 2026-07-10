/**
 * Centralized error handling utilities
 */

import { AxiosError } from 'axios';
import {
  ApiError,
  AuthenticationError,
  ForbiddenError,
  RateLimitError,
  UserNotFoundError,
  NetworkError,
} from '@/shared/types/errors';

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
  const extractMessage = (value: unknown): string => {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      const nestedError = record.error && typeof record.error === "object" ? (record.error as Record<string, unknown>) : null;
      const nestedCandidates = [
        record.detail,
        record.message,
        record.error,
        nestedError?.detail,
        nestedError?.message,
        record.errors,
      ];

      for (const candidate of nestedCandidates) {
        const nestedMessage = extractMessage(candidate);
        if (nestedMessage) {
          return nestedMessage;
        }
      }

      try {
        return JSON.stringify(value);
      } catch {
        return "";
      }
    }

    return "";
  };

  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof AxiosError) {
    const statusCode = error.response?.status;
    const responseData = error.response?.data;
    const message = extractMessage(responseData) || error.message || 'Request failed';
    
    if (statusCode === 401) {
      return new AuthenticationError(
        message,
        responseData,
        error.response ? {
          data: responseData,
          status: error.response.status,
        } : undefined
      );
    }
    
    if (statusCode === 404) {
      return new UserNotFoundError(
        message,
        responseData,
        error.response ? {
          data: responseData,
          status: error.response.status,
        } : undefined
      );
    }

    if (statusCode === 403) {
      return new ForbiddenError(
        message,
        responseData,
        error.response ? {
          data: responseData,
          status: error.response.status,
        } : undefined
      );
    }

    if (statusCode === 429) {
      return new RateLimitError(
        message,
        responseData,
        error.response ? {
          data: responseData,
          status: error.response.status,
        } : undefined
      );
    }

    if (!error.response) {
      return new NetworkError('Network request failed', error);
    }

    return new ApiError(
      message,
      statusCode,
      error.code,
      responseData,
      error.response ? {
        data: responseData,
        status: error.response.status,
      } : undefined
    );
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

