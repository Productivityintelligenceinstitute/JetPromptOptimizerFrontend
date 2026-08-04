"use client";

export const CONTEXT_JOB_DRAFT_STORAGE_KEY = "context-jobs:builder-draft";

export type ContextJobDraftSource = "template" | "prompt";

export interface ContextJobDraftEnvelope {
  source: ContextJobDraftSource;
  sourceId?: string;
  sourceLabel?: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export function storeContextJobDraft(
  payload: Record<string, unknown>,
  meta?: {
    source: ContextJobDraftSource;
    sourceId?: string;
    sourceLabel?: string;
  },
): void {
  if (typeof window === "undefined") {
    return;
  }

  const envelope: ContextJobDraftEnvelope = {
    source: meta?.source ?? "template",
    sourceId: meta?.sourceId,
    sourceLabel: meta?.sourceLabel,
    payload,
    createdAt: new Date().toISOString(),
  };

  window.sessionStorage.setItem(CONTEXT_JOB_DRAFT_STORAGE_KEY, JSON.stringify(envelope));
}

export function consumeContextJobDraft(): ContextJobDraftEnvelope | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(CONTEXT_JOB_DRAFT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  window.sessionStorage.removeItem(CONTEXT_JOB_DRAFT_STORAGE_KEY);

  try {
    const parsed = JSON.parse(raw) as Partial<ContextJobDraftEnvelope>;
    if (!parsed.payload || typeof parsed.payload !== "object" || Array.isArray(parsed.payload)) {
      return null;
    }

    return {
      source: parsed.source === "prompt" ? "prompt" : "template",
      sourceId: typeof parsed.sourceId === "string" ? parsed.sourceId : undefined,
      sourceLabel: typeof parsed.sourceLabel === "string" ? parsed.sourceLabel : undefined,
      payload: parsed.payload,
      createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
