import apiClient from "./client";
import { OptimizationRequest, OptimizationResponse } from "@/shared/types/chat";

export const optimizePrompt = async (
    data: OptimizationRequest
): Promise<OptimizationResponse> => {
    const response = await apiClient.post<OptimizationResponse>(
        "/basic-level-optimization",
        data
    );
    return response.data;
};
