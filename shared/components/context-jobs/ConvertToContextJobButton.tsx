"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createContextJobFromPrompt } from "@/shared/api/contextJobs";
import { useContextJobsEntitlements } from "@/shared/hooks/useContextJobsEntitlements";
import { storeContextJobDraft } from "@/shared/lib/contextJobsDraft";
import {
  buildOptimizedPromptConversionRequest,
  extractOptimizedPrompt,
} from "@/shared/lib/convertOptimizedPromptToJob";
import { cn } from "@/shared/lib/cn";

type ConvertToContextJobButtonProps = {
  /** Full assistant/library message content (markdown/formatted). */
  content: string;
  className?: string;
  /** icon = compact toolbar control; text = labeled button for library cards */
  variant?: "icon" | "text";
};

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4 7.5 12 12l8-4.5L12 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12.5 12 17l8-4.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5 12 21l8-4.5" />
    </svg>
  );
}

export function ConvertToContextJobButton({
  content,
  className,
  variant = "icon",
}: ConvertToContextJobButtonProps) {
  const router = useRouter();
  const entitlements = useContextJobsEntitlements();
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    setError(null);

    if (entitlements.status === "succeeded" && !entitlements.contextJobsEnabled) {
      router.push("/context-jobs");
      return;
    }

    const optimized = extractOptimizedPrompt(content);
    if (optimized.trim().length < 20) {
      setError("Need a longer optimized prompt before converting to a Context Job.");
      return;
    }

    try {
      setIsConverting(true);
      const draft = await createContextJobFromPrompt({
        prompt: buildOptimizedPromptConversionRequest(optimized),
        agentType: "optimized_prompt_conversion",
      });

      const stableFromDraft =
        typeof draft.stableInstructions === "string"
          ? draft.stableInstructions
          : typeof draft.stable_instructions === "string"
            ? draft.stable_instructions
            : "";

      storeContextJobDraft(
        {
          ...draft,
          stableInstructions: stableFromDraft.trim() || optimized,
        },
        {
          source: "prompt",
          sourceLabel: "From optimized prompt",
        },
      );

      router.push("/context-jobs/jobs/new");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert prompt to a Context Job");
    } finally {
      setIsConverting(false);
    }
  };

  if (variant === "text") {
    return (
      <div className={cn("flex flex-col items-end gap-1", className)}>
        <button
          type="button"
          onClick={() => void handleConvert()}
          disabled={isConverting}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          title="Convert optimized prompt to a Context Job"
        >
          <LayersIcon className="h-4 w-4 text-teal-700" />
          {isConverting ? "Converting..." : "Convert to Context Job"}
        </button>
        {error ? <p className="max-w-xs text-right text-xs text-rose-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => void handleConvert()}
        disabled={isConverting}
        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-teal-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        title={isConverting ? "Converting to Context Job..." : "Convert to Context Job"}
        aria-label="Convert to Context Job"
      >
        {isConverting ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-r-transparent" />
        ) : (
          <LayersIcon className="h-4 w-4" />
        )}
      </button>
      {error ? (
        <p className="absolute right-0 top-8 z-20 w-56 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 shadow-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
