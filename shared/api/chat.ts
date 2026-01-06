import apiClient from "./client";
import { OptimizationRequest, OptimizationResponse, ChatListResponse, PaginatedChatMessages } from "@/shared/types/chat";
import { normalizeError, logError } from "@/shared/utils/errorHandler";

export const optimizePrompt = async (
    data: OptimizationRequest
): Promise<OptimizationResponse> => {
    const response = await apiClient.post<OptimizationResponse>(
        "/optimize-prompt/basic-level-optimization",
        data
    );
    return response.data;
};

export const optimizeStructuredPrompt = async (
    data: OptimizationRequest
): Promise<OptimizationResponse> => {
    const response = await apiClient.post<OptimizationResponse>(
        "/optimize-prompt/structure-level-optimization",
        data
    );
    return response.data;
};

export const optimizeMasterPrompt = async (
    data: OptimizationRequest
): Promise<OptimizationResponse> => {
    const response = await apiClient.post<OptimizationResponse>(
        "/optimize-prompt/master-level-optimization",
        data
    );
    return response.data;
};

export const optimizeSystemPrompt = async (
    data: OptimizationRequest
): Promise<OptimizationResponse> => {
    const response = await apiClient.post<OptimizationResponse>(
        "/optimize-prompt/system-level-optimization",
        data
    );
    return response.data;
};

export const getChatList = async (userId: string): Promise<ChatListResponse> => {
    const response = await apiClient.get<ChatListResponse>("/chat-list", {
        params: { user_id: userId }
    });
    return response.data;
};

export const getChatMessages = async (chatId: string): Promise<PaginatedChatMessages> => {
    // Validate chatId before making the API call
    if (!chatId || chatId === 'undefined' || chatId === 'null' || chatId === 'new') {
        throw new Error('Invalid chatId: chatId is required and must be a valid UUID');
    }
    
    try {
        const response = await apiClient.get<PaginatedChatMessages>(`/chat-messages/${chatId}`);
        return response.data;
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, 'getChatMessages');
        throw normalizedError;
    }
};

export const deleteChat = async (userId: string, chatId: string): Promise<void> => {
    try {
        await apiClient.delete<{ detail: string }>(`/delete-chat/remove/${userId}/${chatId}`);
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, 'deleteChat');
        
        if (normalizedError.response?.data?.detail) {
            throw new Error(normalizedError.response.data.detail);
        }
        
        throw new Error("Failed to delete chat. Please try again.");
    }
};
