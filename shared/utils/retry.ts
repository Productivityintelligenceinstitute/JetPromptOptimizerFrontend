/**
 * Retry utility for handling transient failures
 */

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  shouldRetry: () => true,
};

/**
 * Sleep utility for delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retries a function with exponential backoff
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  let delay = opts.delayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!opts.shouldRetry(error) || attempt === opts.maxAttempts) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await sleep(delay);
      delay *= opts.backoffMultiplier;
    }
  }

  throw lastError;
};

