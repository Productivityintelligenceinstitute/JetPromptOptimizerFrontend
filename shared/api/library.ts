import apiClient from "./client";
import { normalizeError, logError } from "@/shared/utils/errorHandler";

export interface SharedPrompt {
    email: string;
    message_id: string;
    content: string;
    created_at?: string;
}

export interface PaginatedSharedPrompts {
    items: SharedPrompt[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

export interface MyLibraryResponseItem {
    message_id: string;
    content: string;
    added_at: string;
}

export interface MyLibraryResponse {
    items: MyLibraryResponseItem[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

/**
 * Add a message to the library using message_id
 */
export const addToLibrary = async (userId: string, messageId: string): Promise<void> => {
    try {
        await apiClient.post<{ detail: string }>("/library/add", {
            user_id: userId,
            message_id: messageId
        });
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, "addToLibrary");
        
        if (normalizedError.response?.data?.detail) {
            throw new Error(normalizedError.response.data.detail);
        }
        
        throw new Error("Failed to add prompt to library. Please try again.");
    }
};

/**
 * Get all shared prompts from the library
 */
export const getLibraryPrompts = async (
    userId: string,
    page: number,
    size: number,
    query?: string
): Promise<PaginatedSharedPrompts> => {
    try {
        const response = await apiClient.get<PaginatedSharedPrompts>("/library", {
            params: { user_id: userId, page, size, q: query || undefined },
        });
        return response.data;
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, "getLibraryPrompts");
        
        if (normalizedError.response?.status === 403) {
            throw new Error("You don't have access to the library. Please upgrade your plan.");
        }
        
        throw new Error("Failed to fetch library prompts. Please try again.");
    }
};

/**
 * Get user's own library
 */
export const getMyLibrary = async (
    userId: string,
    page: number = 1,
    size: number = 100,
    query?: string
): Promise<MyLibraryResponse> => {
    try {
        const response = await apiClient.get<MyLibraryResponse>("/library/me", {
            params: { user_id: userId, page, size, q: query || undefined },
        });
        return response.data;
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, "getMyLibrary");
        throw new Error("Failed to fetch your library. Please try again.");
    }
};

/**
 * Remove a message from library
 */
export const removeFromLibrary = async (userId: string, messageId: string): Promise<void> => {
    try {
        await apiClient.delete<{ detail: string }>(`/library/remove/${messageId}`, {
            params: { user_id: userId },
        });
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, "removeFromLibrary");
        
        if (normalizedError.response?.data?.detail) {
            throw new Error(normalizedError.response.data.detail);
        }
        
        throw new Error("Failed to remove prompt from library. Please try again.");
    }
};

