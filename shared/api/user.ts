import apiClient from "./client";
import { normalizeError, isRetryableError, logError } from "@/shared/utils/errorHandler";
import { withRetry } from "@/shared/utils/retry";
import { ApiError, UserNotFoundError } from "@/shared/types/errors";

/**
 * Request payload for creating/updating user account
 */
export interface CreateAccountRequest {
    full_name?: string;
}

/**
 * Response payload from backend user endpoints
 * Backend may return trial_ends_at or end_date (both mean trial end timestamp)
 */
export interface UserData {
    user_id: string;
    email: string;
    full_name: string | null;
    role: string;
    firebase_uid: string;
    created_at: string | null;
    package_name: string;
    trial_ends_at?: string | null;
    end_date?: string | null;
}

export interface AdminUserListItem {
    user_id: string;
    email: string;
    full_name: string | null;
    role: string;
    firebase_uid: string | null;
    created_at: string | null;
    package_name?: string | null;
    trial_ends_at?: string | null;
    /** Current or last subscription end date (expiry / cancelled). */
    expiry_date?: string | null;
    last_activity_at?: string | null;
    is_expired?: boolean;
    /** Display: Trialing / Active / Past Due / Suspended / Canceled / Expired / No subscription */
    subscription_status?: string | null;
}

export interface AdminUserListResponse {
    items: AdminUserListItem[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

/**
 * Creates or updates user account in backend
 * Idempotent operation - safe to call multiple times
 */
export const createAccount = async (userData: CreateAccountRequest): Promise<void> => {
    try {
        await withRetry(
            () => apiClient.post<void>("/create-account", userData),
            {
                shouldRetry: isRetryableError,
            }
        );
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, 'createAccount');
        
        // Don't throw for account creation failures - user might already exist
        // This allows the flow to continue and try fetching user data
        if (normalizedError instanceof UserNotFoundError) {
            throw normalizedError;
        }
        // Silently handle other errors as account might already exist
    }
};

/**
 * Fetches current authenticated user data from backend
 * @throws {UserNotFoundError} if user doesn't exist in backend
 * @throws {ApiError} for other API errors
 */
export const getCurrentUser = async (): Promise<UserData> => {
    try {
        const response = await withRetry(
            () => apiClient.get<UserData>("/me"),
            {
                shouldRetry: isRetryableError,
            }
        );

        const data = response.data;
        if (!data?.user_id) {
            throw new ApiError('Invalid user data received from server');
        }
        // Normalize trial end: backend may return trial_ends_at or end_date
        if (data.trial_ends_at != null || data.end_date != null) {
            (data as UserData).trial_ends_at = data.trial_ends_at ?? data.end_date;
        }
        return data;
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, 'getCurrentUser');
        throw normalizedError;
    }
};

export const updateUserRole = async (email: string, newRole: string): Promise<void> => {
    try {
        await withRetry(
            () =>
                apiClient.put("/update-role", {
                    email,
                    new_role: newRole,
                }),
            {
                shouldRetry: isRetryableError,
            }
        );
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, "updateUserRole");
        throw normalizedError;
    }
};

/**
 * Soft-deletes the current user's account.
 * After success, user must sign out and redirect (backend rejects login/me for soft-deleted users).
 */
export const deleteAccount = async (userId: string): Promise<void> => {
    try {
        await apiClient.delete<void>(`/delete-account/${userId}`);
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, 'deleteAccount');
        throw normalizedError;
    }
};

export const getAdminUsers = async (
    adminUserId: string,
    page: number,
    size: number,
    query?: string
): Promise<AdminUserListResponse> => {
    try {
        const response = await withRetry(
            () =>
                apiClient.get<AdminUserListResponse>("/admin/users", {
                    params: {
                        user_id: adminUserId,
                        page,
                        size,
                        q: query || undefined,
                    },
                }),
            {
                shouldRetry: isRetryableError,
            }
        );

        return response.data;
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, "getAdminUsers");
        throw normalizedError;
    }
};
