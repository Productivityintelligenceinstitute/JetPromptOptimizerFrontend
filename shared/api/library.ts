import apiClient from "./client";
import { normalizeError, logError } from "@/shared/utils/errorHandler";

export interface SharedPrompt {
    email: string;
    content: string;
    created_at?: string;
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
export const getLibraryPrompts = async (userId: string): Promise<SharedPrompt[]> => {
    try {
        const response = await apiClient.get<SharedPrompt[]>("/library", {
            params: { user_id: userId },
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
export const getMyLibrary = async (userId: string): Promise<Array<{
    message_id: string;
    content: string;
    added_at: string;
}>> => {
    try {
        const response = await apiClient.get<Array<{
            message_id: string;
            content: string;
            added_at: string;
        }>>("/library/me", {
            params: { user_id: userId },
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
export const removeFromLibrary = async (messageId: string): Promise<void> => {
    try {
        await apiClient.delete<{ detail: string }>(`/library/remove/${messageId}`);
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, "removeFromLibrary");
        
        if (normalizedError.response?.data?.detail) {
            throw new Error(normalizedError.response.data.detail);
        }
        
        throw new Error("Failed to remove prompt from library. Please try again.");
    }
};

