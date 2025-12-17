"use client";

import { useMutation } from "@tanstack/react-query";
import { optimizePrompt } from "@/shared/api/chat";
import { OptimizationRequest, OptimizationResponse } from "@/shared/types/chat";

export const useOptimizePrompt = () => {
    return useMutation<OptimizationResponse, Error, OptimizationRequest>({
        mutationFn: optimizePrompt,
    });
};
