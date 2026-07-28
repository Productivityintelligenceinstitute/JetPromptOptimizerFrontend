/**
 * Helpers for converting an optimized prompt (Chat / Library) into a Context Job draft.
 */

const OPTIMIZED_PROMPT_PATTERNS = [
  /\*\*Optimized Prompt:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/i,
  /\*\*Your Optimized Prompt \(Mastery Mode\):\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/i,
  /\*\*Master-Level Optimized Prompt:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/i,
  /\*\*Updated Prompt:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/i,
  /\*\*Develop \(Optimized Prompt\)\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/i,
];

/** Pull the optimized prompt section out of a formatted assistant / library message. */
export function extractOptimizedPrompt(content: string): string {
  const text = (content || "").trim();
  if (!text) return "";

  for (const pattern of OPTIMIZED_PROMPT_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }

  const lines = text.split("\n").filter((line) => line.trim() && !line.trim().startsWith("**"));
  if (lines.length > 0) {
    return lines.join("\n").trim();
  }

  return text;
}

/**
 * Wrap an optimized prompt so the from-prompt API treats it as a job-creation request
 * (raw optimized prompts alone often fail the "is this a job use case?" gate).
 */
export function buildOptimizedPromptConversionRequest(optimizedPrompt: string): string {
  const body = optimizedPrompt.trim();
  return [
    "Create a reusable Context Job that repeatedly executes the following optimized prompt as its core workflow.",
    "Derive a clear job name, goal, role configuration, workflow type, stable instructions, and light validation from this prompt.",
    "Prefer keeping the optimized prompt text as the primary stable instructions so the job preserves the user's optimized wording.",
    "",
    "Optimized prompt:",
    '"""',
    body,
    '"""',
  ].join("\n");
}
