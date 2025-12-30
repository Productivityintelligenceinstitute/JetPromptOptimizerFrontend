import apiClient from "./client";
import { OptimizationRequest, OptimizationResponse, ChatListResponse, PaginatedChatMessages } from "@/shared/types/chat";
import { normalizeError, logError } from "@/shared/utils/errorHandler";

export const optimizePrompt = async (
    data: OptimizationRequest
): Promise<OptimizationResponse> => {
    const response = await apiClient.post<OptimizationResponse>(
        "/basic-level-optimization",
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
    try {
        const response = await apiClient.get<PaginatedChatMessages>(`/chat-messages/${chatId}`);
        return response.data;
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, 'getChatMessages');
        throw normalizedError;
    }
};
