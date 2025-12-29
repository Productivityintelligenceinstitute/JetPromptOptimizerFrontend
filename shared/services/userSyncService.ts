/**
 * Service for synchronizing Firebase user with backend
 * Handles account creation and user data fetching with proper error handling
 */

import { User as FirebaseUser } from 'firebase/auth';
import { createAccount, getCurrentUser, UserData } from '@/shared/api/user';
import { normalizeError, logError } from '@/shared/utils/errorHandler';
import { UserNotFoundError } from '@/shared/types/errors';
import { withRetry } from '@/shared/utils/retry';
import { isRetryableError } from '@/shared/utils/errorHandler';
import { USER_SYNC_RETRY_OPTIONS } from '@/shared/constants/auth';

export interface SyncedUser {
    firebaseUid: string;
    userId: string;
    email: string;
    name?: string;
    role: string;
    token: string;
}

export interface UserSyncResult {
    success: boolean;
    user?: SyncedUser;
    error?: Error;
}

/**
 * Ensures user account exists in backend (idempotent)
 */
const ensureAccountExists = async (firebaseUser: FirebaseUser): Promise<void> => {
    try {
        await withRetry(
            () => createAccount({
                full_name: firebaseUser.displayName || undefined,
            }),
            {
                ...USER_SYNC_RETRY_OPTIONS,
                shouldRetry: isRetryableError,
            }
        );
    } catch (error) {
        const normalizedError = normalizeError(error);
        
        // Only log, don't throw - account might already exist
        // This is expected behavior for existing users
        if (!(normalizedError instanceof UserNotFoundError)) {
            logError(normalizedError, 'ensureAccountExists');
        }
    }
};

/**
 * Fetches user data from backend
 */
const fetchUserData = async (): Promise<UserData> => {
    return await withRetry(
        () => getCurrentUser(),
        {
            ...USER_SYNC_RETRY_OPTIONS,
            shouldRetry: isRetryableError,
        }
    );
};

/**
 * Creates a fallback user object from Firebase data
 * Used when backend is unavailable but user is authenticated
 */
const createFallbackUser = (firebaseUser: FirebaseUser, token: string): SyncedUser => {
    return {
        firebaseUid: firebaseUser.uid,
        userId: firebaseUser.uid, // Fallback to Firebase UID
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || undefined,
        role: 'user', // Default role
        token,
    };
};

/**
 * Synchronizes Firebase user with backend
 * Handles account creation, user data fetching, and error recovery
 */
export const syncUserWithBackend = async (
    firebaseUser: FirebaseUser,
    token: string
): Promise<UserSyncResult> => {
    try {
        // Step 1: Ensure account exists (idempotent)
        await ensureAccountExists(firebaseUser);

        // Step 2: Fetch user data from backend
        const userData = await fetchUserData();

        const syncedUser: SyncedUser = {
            firebaseUid: firebaseUser.uid,
            userId: userData.user_id,
            email: userData.email,
            name: userData.full_name || undefined,
            role: userData.role,
            token,
        };

        return {
            success: true,
            user: syncedUser,
        };
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, 'syncUserWithBackend');

        // If user not found, we can't proceed
        if (normalizedError instanceof UserNotFoundError) {
            return {
                success: false,
                error: normalizedError,
            };
        }

        // For other errors, provide fallback user data
        // This allows the app to function even if backend is temporarily unavailable
        const fallbackUser = createFallbackUser(firebaseUser, token);
        
        return {
            success: false,
            user: fallbackUser, // Provide fallback for graceful degradation
            error: normalizedError,
        };
    }
};

