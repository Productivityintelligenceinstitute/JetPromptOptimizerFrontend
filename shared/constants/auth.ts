/**
 * Authentication-related constants
 */

export const AUTH_COOKIE_NAME = 'token';
export const AUTH_COOKIE_EXPIRY_DAYS = 7;

export const USER_SYNC_RETRY_OPTIONS = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
} as const;

export const USER_FETCH_TIMEOUT_MS = 10000; // 10 seconds

