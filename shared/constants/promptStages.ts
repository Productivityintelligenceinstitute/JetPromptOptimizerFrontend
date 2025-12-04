export type PromptStageId = "basic" | "structured" | "master" | "system";

export interface PromptStage {
  id: PromptStageId;
  title: string;
  description: string;
  accent?: "primary" | "muted";
}

export const PROMPT_STAGES: ReadonlyArray<PromptStage> = [
  {
    id: "basic",
    title: "Basic Prompt",
    description:
      "Transform your raw thoughts, ideas, or scattered notes into a clean, simple, and actionable prompt.",
    accent: "muted",
  },
  {
    id: "structured",
    title: "Structured Prompt",
    description:
      "Take your idea a step further by organizing it with clear formatting, context, and intent.",
    accent: "primary",
  },
  {
    id: "master",
    title: "Master Prompt",
    description:
      "Elevate your prompt into an expert-level instruction set with constraints, goals, and domain specifics.",
    accent: "muted",
  },
  {
    id: "system",
    title: "System Prompt",
    description:
      "Craft powerful, AI-ready system instructions that shape behavior, style, role, and boundaries.",
    accent: "muted",
  },
] as const;
