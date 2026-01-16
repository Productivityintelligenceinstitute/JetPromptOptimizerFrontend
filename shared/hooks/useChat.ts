"use client";

import { useMutation } from "@tanstack/react-query";
import { optimizePrompt, optimizeStructuredPrompt, optimizeMasterPrompt, optimizeSystemPrompt } from "@/shared/api/chat";
import { OptimizationRequest, OptimizationResponse } from "@/shared/types/chat";

export const useOptimizePrompt = () => {
    return useMutation<OptimizationResponse, Error, OptimizationRequest>({
        mutationFn: optimizePrompt,
    });
};

export const useOptimizeStructuredPrompt = () => {
    return useMutation<OptimizationResponse, Error, OptimizationRequest>({
        mutationFn: optimizeStructuredPrompt,
    });
};

export const useOptimizeMasterPrompt = () => {
    return useMutation<OptimizationResponse, Error, OptimizationRequest>({
        mutationFn: optimizeMasterPrompt,
    });
};

export const useOptimizeSystemPrompt = () => {
    return useMutation<OptimizationResponse, Error, OptimizationRequest>({
        mutationFn: optimizeSystemPrompt,
    });
};
