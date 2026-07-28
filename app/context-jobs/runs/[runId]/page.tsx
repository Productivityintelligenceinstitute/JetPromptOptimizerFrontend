"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/shared/components/auth/AuthGuard";
import {
  confirmContextJobMemoryChanges,
  downloadContextJobRunArtifact,
  getContextJob,
  getContextJobRun,
  getContextJobRunArtifacts,
  getContextJobRunChain,
  getContextJobRunPendingApprovals,
  replayContextJobRun,
  submitContextJobToolApproval,
  type ContextJob,
  type ContextJobRun,
  type ContextJobsPendingToolApproval,
  type ContextJobsRunArtifact,
  type ContextJobsRunChain,
  type ContextJobsRunChainNode,
  type ContextJobsRunOutputPackage,
} from "@/shared/api/contextJobs";
import { StructuredRunResult } from "@/shared/components/context-jobs/StructuredRunResult";
import { useContextJobsEntitlements } from "@/shared/hooks/useContextJobsEntitlements";

const terminalStates = new Set([
  "completed",
  "completed_with_warnings",
  "needs_human_review",
  "repair",
  "failed",
  "escalated",
  "blocked_by_policy",
]);

const stateMeta: Record<string, { label: string; className: string; dotClass: string }> = {
  queued: { label: "Queued", className: "bg-slate-100 text-slate-700", dotClass: "bg-slate-400" },
  planning: { label: "Planning", className: "bg-blue-100 text-blue-700", dotClass: "bg-blue-500" },
  retrieving: { label: "Retrieving", className: "bg-blue-100 text-blue-700", dotClass: "bg-blue-500" },
  executing: { label: "Executing", className: "bg-blue-100 text-blue-700", dotClass: "bg-blue-500" },
  validating: { label: "Validating", className: "bg-amber-100 text-amber-800", dotClass: "bg-amber-500" },
  awaiting_tool_approval: { label: "Awaiting tool approval", className: "bg-amber-100 text-amber-800", dotClass: "bg-amber-500" },
  awaiting_memory_approval: { label: "Awaiting memory approval", className: "bg-amber-100 text-amber-800", dotClass: "bg-amber-500" },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-700", dotClass: "bg-emerald-500" },
  completed_with_warnings: { label: "Completed with warnings", className: "bg-yellow-100 text-yellow-800", dotClass: "bg-yellow-500" },
  needs_human_review: { label: "Needs review", className: "bg-sky-100 text-sky-700", dotClass: "bg-sky-500" },
  repair: { label: "Repair", className: "bg-orange-100 text-orange-800", dotClass: "bg-orange-500" },
  escalated: { label: "Escalated", className: "bg-rose-100 text-rose-700", dotClass: "bg-rose-500" },
  failed: { label: "Failed", className: "bg-rose-100 text-rose-700", dotClass: "bg-rose-500" },
  blocked_by_policy: { label: "Blocked by policy", className: "bg-rose-100 text-rose-700", dotClass: "bg-rose-500" },
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatDuration(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Not set";
  }

  if (value < 1000) return `${value}ms`;
  return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}s`;
}

function formatTokens(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Not set";
  }

  return new Intl.NumberFormat().format(value);
}

function normalizeRunId(runIdParam: string | string[] | undefined): string | null {
  if (typeof runIdParam === "string" && runIdParam.trim()) {
    return runIdParam;
  }

  if (Array.isArray(runIdParam) && typeof runIdParam[0] === "string" && runIdParam[0].trim()) {
    return runIdParam[0];
  }

  return null;
}

function getStateMeta(state: string) {
  return stateMeta[state] ?? {
    label: state.replace(/_/g, " ") || "Unknown",
    className: "bg-slate-100 text-slate-700",
    dotClass: "bg-slate-400",
  };
}

function getResultContent(pkg: ContextJobsRunOutputPackage | null | undefined, run: ContextJobRun | null): string {
  const primary = pkg?.primaryResult?.content;
  if (typeof primary === "string" && primary.trim()) {
    return primary;
  }

  if (typeof run?.outputText === "string" && run.outputText.trim()) {
    return run.outputText;
  }

  return "No structured output was returned for this run yet.";
}

function getResultPreviewText(content: string): string {
  const plainText = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_`|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plainText) {
    return "No preview available.";
  }

  return plainText.length > 220 ? `${plainText.slice(0, 220).trimEnd()}...` : plainText;
}

function formatBytes(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    return "Unknown size";
  }
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatEventLabel(event: unknown, index: number): string {
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    return `Event ${index + 1}`;
  }

  const record = event as Record<string, unknown>;
  const candidates = [record.step, record.name, record.type, record.toolId, record.tool_id, record.phase, record.event];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return `Event ${index + 1}`;
}

function formatEventDetail(event: unknown): string {
  if (event == null) return "No details";
  if (typeof event === "string") return event;
  try {
    return JSON.stringify(event, null, 2);
  } catch {
    return String(event);
  }
}

function ChainNodeCard({ node, depth = 0 }: { node: ContextJobsRunChainNode; depth?: number }) {
  return (
    <div className={depth > 0 ? "ml-4 border-l border-slate-200 pl-4" : ""}>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/context-jobs/runs/${node.runId}`}
            className="text-sm font-semibold text-teal-700 hover:underline"
          >
            {node.jobName || `Run ${node.runId.slice(0, 8)}`}
          </Link>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">
            {node.status.replace(/_/g, " ")}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {formatDate(node.createdAt)} · {node.runId}
        </p>
      </div>
      {(node.childRuns ?? []).map((child) => (
        <div key={child.runId} className="mt-3">
          <ChainNodeCard node={child} depth={depth + 1} />
        </div>
      ))}
    </div>
  );
}

function TracePanel({
  title,
  events,
}: {
  title: string;
  events: unknown[] | null | undefined;
}) {
  const items = Array.isArray(events) ? events : [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No events recorded.</p>
      ) : (
        <div className="mt-3 max-h-72 space-y-2 overflow-auto">
          {items.map((event, index) => (
            <details key={`${title}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium text-slate-800">
                {formatEventLabel(event, index)}
              </summary>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-xs leading-5 text-slate-100">
                {formatEventDetail(event)}
              </pre>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

function valueToText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function getCheckTitle(check: Record<string, unknown>, index: number): string {
  return valueToText(check.name) || valueToText(check.title) || valueToText(check.label) || `Check ${index + 1}`;
}

function getCheckSummary(check: Record<string, unknown>): string {
  return (
    valueToText(check.message) ||
    valueToText(check.detail) ||
    valueToText(check.result) ||
    valueToText(check.status) ||
    "No details were provided."
  );
}

function getCheckResultMeta(result: string): { label: string; className: string } {
  const normalized = result.trim().toLowerCase();
  if (normalized === "passed" || normalized === "pass") {
    return { label: "Passed", className: "bg-emerald-100 text-emerald-800" };
  }
  if (normalized === "warning") {
    return { label: "Warning", className: "bg-amber-100 text-amber-800" };
  }
  if (normalized === "failed" || normalized === "fail") {
    return { label: "Failed", className: "bg-rose-100 text-rose-800" };
  }
  return { label: result || "Unknown", className: "bg-slate-100 text-slate-700" };
}

function formatCheckJson(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineMarkdown(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*(.+?)\*(?!\*)/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return false;

  const cells = trimmed
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());

  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function renderMarkdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push(`<h${level} class="font-semibold tracking-tight text-slate-900">${inlineMarkdown(headingMatch[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (index < lines.length) {
        const current = lines[index].trim();
        if (!current || !(current.startsWith("|") && current.endsWith("|"))) {
          break;
        }
        tableLines.push(current);
        index += 1;
      }

      const headerLine = tableLines[0];
      const bodyLines = tableLines.slice(1).filter((entry) => !isTableSeparator(entry));
      const headers = headerLine
        .slice(1, -1)
        .split("|")
        .map((cell) => inlineMarkdown(cell.trim()));

      const rows = bodyLines.map((row) =>
        row
          .slice(1, -1)
          .split("|")
          .map((cell) => inlineMarkdown(cell.trim()))
      );

      blocks.push(`
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                ${headers.map((header) => `<th class="border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-900">${header}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row) => `
                    <tr>
                      ${row
                        .map((cell) => `<td class="border border-slate-200 px-3 py-2 align-top text-slate-700">${cell}</td>`)
                        .join("")}
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `);
      continue;
    }

    if (/^(\*|-)\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length) {
        const current = lines[index].trim();
        if (!/^(\*|-)\s+/.test(current)) {
          break;
        }
        items.push(current.replace(/^(\*|-)\s+/, ""));
        index += 1;
      }

      blocks.push(
        `<ul class="ml-5 list-disc space-y-2 text-slate-700">${items
          .map((item) => `<li>${inlineMarkdown(item)}</li>`)
          .join("")}</ul>`
      );
      continue;
    }

    const paragraphLines: string[] = [trimmed];
    index += 1;
    while (index < lines.length) {
      const next = lines[index].trim();
      if (!next || /^(#{1,6})\s+/.test(next) || /^(\*|-)\s+/.test(next) || (next.startsWith("|") && next.endsWith("|"))) {
        break;
      }
      paragraphLines.push(next);
      index += 1;
    }

    blocks.push(`<p class="leading-7 text-slate-700">${inlineMarkdown(paragraphLines.join(" "))}</p>`);
  }

  return blocks.join("\n");
}

function ContextJobRunDetailContent({ runId }: { runId: string }) {
  const router = useRouter();
  const entitlements = useContextJobsEntitlements();
  const [run, setRun] = useState<ContextJobRun | null>(null);
  const [job, setJob] = useState<ContextJob | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<ContextJobsPendingToolApproval[]>([]);
  const [approvalBusyId, setApprovalBusyId] = useState<string | null>(null);
  const [memoryBusy, setMemoryBusy] = useState<"approved" | "denied" | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollWarning, setPollWarning] = useState<string | null>(null);
  const [chain, setChain] = useState<ContextJobsRunChain | null>(null);
  const [artifacts, setArtifacts] = useState<ContextJobsRunArtifact[]>([]);
  const [chainError, setChainError] = useState<string | null>(null);
  const [artifactsError, setArtifactsError] = useState<string | null>(null);
  const [downloadBusyPath, setDownloadBusyPath] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const timerRef = useRef<number | null>(null);
  const loadInFlightRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);

  const loadRun = useCallback(async (): Promise<void> => {
    if (loadInFlightRef.current) {
      return;
    }
    loadInFlightRef.current = true;
    try {
      const runData = await getContextJobRun(runId);
      if (!mountedRef.current) return;

      setRun(runData);
      hasLoadedOnceRef.current = true;

      if (runData.job) {
        setJob(runData.job);
      } else if (runData.jobId) {
        try {
          const jobData = await getContextJob(runData.jobId);
          if (mountedRef.current) {
            setJob(jobData);
          }
        } catch {
          // Keep the run detail usable even if the linked job lookup fails.
        }
      }

      if (runData.state === "awaiting_tool_approval") {
        try {
          const approvals = await getContextJobRunPendingApprovals(runId);
          if (mountedRef.current) {
            setPendingApprovals(approvals);
          }
        } catch {
          if (mountedRef.current) {
            setPendingApprovals([]);
          }
        }
      } else {
        setPendingApprovals([]);
      }

      if (terminalStates.has(runData.state) && timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setError(null);
      setPollWarning(null);
    } catch (err) {
      if (!mountedRef.current) return;
      const message = err instanceof Error ? err.message : "Failed to load run";
      // Transient poll failures (timeouts while worker holds DB) must not look like a failed run.
      if (hasLoadedOnceRef.current) {
        setPollWarning("Live refresh delayed — retrying. The run may still be processing.");
        setError(null);
      } else {
        setError(message);
      }
    } finally {
      loadInFlightRef.current = false;
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [runId]);

  useEffect(() => {
    mountedRef.current = true;
    hasLoadedOnceRef.current = false;

    void loadRun();
    timerRef.current = window.setInterval(() => {
      void loadRun();
    }, 2500);

    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [loadRun]);

  useEffect(() => {
    if (run && terminalStates.has(run.state)) {
      setPendingApprovals([]);
    }
  }, [run]);

  useEffect(() => {
    let cancelled = false;

    const loadExtras = async () => {
      try {
        const chainData = await getContextJobRunChain(runId);
        if (!cancelled) {
          setChain(chainData);
          setChainError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setChain(null);
          setChainError(err instanceof Error ? err.message : "Failed to load chain");
        }
      }

      try {
        const artifactsData = await getContextJobRunArtifacts(runId);
        if (!cancelled) {
          setArtifacts(artifactsData.artifacts);
          setArtifactsError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setArtifacts([]);
          setArtifactsError(err instanceof Error ? err.message : "Failed to load artifacts");
        }
      }
    };

    void loadExtras();
    return () => {
      cancelled = true;
    };
  }, [runId, run?.state, run?.endedAt]);

  const handleArtifactDownload = async (artifact: ContextJobsRunArtifact) => {
    setDownloadBusyPath(artifact.path);
    setError(null);
    try {
      const blob = await downloadContextJobRunArtifact(runId, artifact.path);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const fileName = artifact.path.split("/").pop() || artifact.path;
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download artifact");
    } finally {
      setDownloadBusyPath(null);
    }
  };

  const meta = useMemo(() => getStateMeta(run?.state || "queued"), [run?.state]);
  const hasChainLinks = Boolean(
    chain && (chain.parentRun || (chain.childRuns && chain.childRuns.length > 0)),
  );
  const isLive = run ? !terminalStates.has(run.state) : false;
  const jobLabel = job?.name || run?.job?.name || (run?.jobId ? `Job ${run.jobId.slice(0, 8)}` : "Context Job");
  const resultContent = getResultContent(run?.runOutputPackage, run);
  const resultPreview = getResultPreviewText(resultContent);
  const renderedResultContent = useMemo(() => renderMarkdownToHtml(resultContent), [resultContent]);
  const validationSummary = run?.runOutputPackage?.validationSummary ?? null;
  const hasFinalResult =
    Boolean(run?.runOutputPackage?.primaryResult?.content?.trim()) ||
    Boolean(run?.outputText?.trim()) ||
    Boolean(validationSummary) ||
    terminalStates.has(run?.state || "");

  const handleToolApproval = async (approvalId: string, decision: "approved" | "denied"): Promise<void> => {
    try {
      setApprovalBusyId(approvalId);
      setError(null);
      const updatedRun = await submitContextJobToolApproval(runId, approvalId, {
        decision,
        notes: decision === "approved" ? "Approved from the frontend" : "Denied from the frontend",
      });

      if (!mountedRef.current) return;
      setRun(updatedRun);
      await loadRun();
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to submit tool approval");
    } finally {
      if (mountedRef.current) {
        setApprovalBusyId(null);
      }
    }
  };

  const handleMemoryApproval = async (approved: boolean): Promise<void> => {
    try {
      setMemoryBusy(approved ? "approved" : "denied");
      setError(null);
      const updatedRun = await confirmContextJobMemoryChanges(runId, approved);

      if (!mountedRef.current) return;
      setRun(updatedRun);
      await loadRun();
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to confirm memory changes");
    } finally {
      if (mountedRef.current) {
        setMemoryBusy(null);
      }
    }
  };

  const handleReplay = async (): Promise<void> => {
    try {
      setIsReplaying(true);
      setError(null);
      const replayedRun = await replayContextJobRun(runId);
      if (!mountedRef.current) return;
      router.push(`/context-jobs/runs/${replayedRun.id}`);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to replay run");
    } finally {
      if (mountedRef.current) {
        setIsReplaying(false);
      }
    }
  };

  if (entitlements.status === "succeeded" && !entitlements.contextJobsEnabled) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_42%),linear-gradient(180deg,_#f8fbff_0%,_#f5f7fb_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Upgrade required</p>
            <h1 className="mt-3 text-2xl font-semibold text-amber-950">Context Jobs are not enabled for this account</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-900/80">
              Your current plan does not allow Context Jobs access. Upgrade to Pro to inspect runs here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_42%),linear-gradient(180deg,_#f7fcfc_0%,_#f4f8f8_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/context-jobs/runs" className="text-sm font-medium text-teal-700 hover:text-teal-900">
                Back to runs
              </Link>
              <span className="text-xs text-slate-400">/</span>
              <Link href="/context-jobs/jobs" className="text-sm font-medium text-teal-700 hover:text-teal-900">
                Jobs
              </Link>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Run detail
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
              Watch the run state, inspect the structured output, and jump back to the parent job when you want to tweak the config.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {run?.jobId ? (
              <Link
                href={`/context-jobs/jobs/${run.jobId}`}
                className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-50 sm:w-auto"
              >
                Open job
              </Link>
            ) : null}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {pollWarning && !error ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <p className="text-sm font-medium">{pollWarning}</p>
          </div>
        ) : null}

        {isLoading || entitlements.status === "loading" ? (
          <div className="flex items-center justify-center rounded-3xl border border-white/70 bg-white/80 py-16 shadow-sm backdrop-blur">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent" />
              <p className="mt-4 text-sm text-slate-600">Loading run...</p>
            </div>
          </div>
        ) : run ? (
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${meta.dotClass} ${isLive ? "animate-pulse" : ""}`} />
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
                    {run.outcome ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {run.outcome.replace(/_/g, " ")}
                      </span>
                    ) : null}
                    {isLive ? (
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Live</span>
                    ) : null}
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{jobLabel}</h2>
                  <p className="max-w-3xl text-sm leading-6 text-slate-600">
                    {run.userRequest || "No user request was captured for this run."}
                  </p>
                </div>

                <div className="grid gap-2 text-sm text-slate-700 lg:w-80">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Run id</p>
                    <p className="mt-1 break-all font-medium text-slate-900">{run.id}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Parent job</p>
                    <p className="mt-1 break-all font-medium text-slate-900">{run.jobId}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">Tokens</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{formatTokens(run.tokenUsage)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {formatTokens(run.totalProviderTokens)} provider / {formatTokens(run.totalToolCalls)} tool calls
                </p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">Runtime</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{formatDuration(run.latencyMs)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Estimated from the backend trace</p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">Started</p>
                <p className="mt-3 text-lg font-semibold tracking-tight text-slate-900">{formatDate(run.startedAt)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Ended {formatDate(run.endedAt)}</p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">Model</p>
                <p className="mt-3 text-lg font-semibold tracking-tight text-slate-900">
                  {run.executionProvider || "Not set"} / {run.executionModel || "Not set"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Job version {run.jobVersion ?? "Not set"}</p>
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Primary result</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">
                      {run.runOutputPackage?.primaryResult?.title || "Run output"}
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      {resultPreview}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => void handleReplay()}
                      disabled={isReplaying}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isReplaying ? "Replaying..." : "Replay"}
                    </button>
                    <Link
                      href={`/context-jobs/jobs/${run.jobId}`}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
                    >
                      Open job
                    </Link>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {!hasFinalResult && isLive ? (
                    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
                      <div className="inline-block h-9 w-9 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">Final result is still loading</p>
                        <p className="text-sm text-slate-600">
                          We’re waiting for the run to finish before showing the full output here.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <StructuredRunResult content={resultContent} renderedHtml={renderedResultContent} />
                  )}
                </div>

                {validationSummary ? (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Validation summary</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Decision</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{validationSummary.overallDecision || "Not set"}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Confidence</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{validationSummary.confidenceLevel || "Not set"}</p>
                      </div>
                    </div>
                    {validationSummary.repairReason ? (
                      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                        <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Repair reason</p>
                        <p className="mt-1 leading-6">{validationSummary.repairReason}</p>
                      </div>
                    ) : null}
                    {Array.isArray(validationSummary.checks) && validationSummary.checks.length ? (
                      <div className="mt-4 space-y-2">
                        {validationSummary.checks.map((check, index) => {
                          const result = valueToText(check.result) || valueToText(check.status);
                          const resultMeta = getCheckResultMeta(result);
                          const checker = valueToText(check.checker);
                          const ruleType = valueToText(check.type);
                          const expected = formatCheckJson(check.expected);
                          const found = formatCheckJson(check.found);
                          const isProcurement = ruleType === "procurement" || Boolean(checker);
                          return (
                            <div key={`${String(check.name ?? "check")}-${index}`} className="rounded-2xl bg-slate-50 px-4 py-3">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-900">{getCheckTitle(check, index)}</p>
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${resultMeta.className}`}>
                                  {resultMeta.label}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-slate-500">{getCheckSummary(check)}</p>
                              {isProcurement ? (
                                <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Procurement check{checker ? `: ${checker}` : ""}
                                  </p>
                                  {expected ? (
                                    <div>
                                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Expected</p>
                                      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-[11px] leading-5 text-slate-700">{expected}</pre>
                                    </div>
                                  ) : null}
                                  {found ? (
                                    <div>
                                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Found</p>
                                      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-[11px] leading-5 text-slate-700">{found}</pre>
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {run.state === "awaiting_tool_approval" ? (
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold">Pending tool approvals</p>
                        <p className="mt-1 text-sm leading-6">
                          This run is waiting on human approval for one or more tool actions.
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                        {pendingApprovals.length} pending
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {pendingApprovals.length ? (
                        pendingApprovals.map((approval) => (
                          <div key={approval.id} className="rounded-2xl border border-amber-200 bg-white p-4 text-slate-900">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold">{approval.toolName || approval.toolId || "Tool approval"}</p>
                                <p className="mt-1 text-sm text-slate-600">{approval.reason || "Approval required before execution."}</p>
                                <p className="mt-2 text-xs text-slate-500">Requested {formatDate(approval.requestedAt)}</p>
                              </div>

                              <div className="flex shrink-0 flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={approvalBusyId === approval.id}
                                  onClick={() => void handleToolApproval(approval.id, "denied")}
                                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Deny
                                </button>
                                <button
                                  type="button"
                                  disabled={approvalBusyId === approval.id}
                                  onClick={() => void handleToolApproval(approval.id, "approved")}
                                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {approvalBusyId === approval.id ? "Saving..." : "Approve"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-4 text-sm text-amber-900/80">
                          Pending approvals should appear here once the backend returns them.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {run.state === "awaiting_memory_approval" ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold">Pending memory changes</p>
                        <p className="mt-1 text-sm leading-6">
                          Memory writes are waiting to be confirmed before the run can continue.
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                        Approval required
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl border border-amber-200 bg-white p-4 text-slate-900">
                      {run.pendingMemoryChanges ? (
                        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                          {JSON.stringify(run.pendingMemoryChanges, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-sm text-slate-600">No memory change details were returned.</p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={memoryBusy !== null}
                          onClick={() => void handleMemoryApproval(false)}
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {memoryBusy === "denied" ? "Saving..." : "Deny"}
                        </button>
                        <button
                          type="button"
                          disabled={memoryBusy !== null}
                          onClick={() => void handleMemoryApproval(true)}
                          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {memoryBusy === "approved" ? "Saving..." : "Approve"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <aside className="space-y-4">
                <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Navigation</p>
                  <div className="mt-4 flex flex-col gap-3">
                    <Link
                      href={`/context-jobs/jobs/${run.jobId}`}
                      className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                    >
                      Open parent job
                    </Link>
                    <Link
                      href="/context-jobs/runs"
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
                    >
                      Back to runs
                    </Link>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">State notes</p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Current state</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{meta.label}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Live polling</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{isLive ? "Running" : "Stopped"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Workspace</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{run.workspaceId || "Not set"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Plan</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{entitlements.plan || "Not set"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Artifacts</p>
                  {artifactsError ? (
                    <p className="mt-3 text-sm text-rose-700">{artifactsError}</p>
                  ) : artifacts.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">No downloadable artifacts for this run.</p>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {artifacts.map((artifact) => (
                        <div
                          key={artifact.path}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <p className="truncate text-sm font-semibold text-slate-900">{artifact.path}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatBytes(artifact.sizeBytes)}
                            {artifact.mimeType ? ` · ${artifact.mimeType}` : ""}
                            {artifact.toolId ? ` · ${artifact.toolId}` : ""}
                          </p>
                          <button
                            type="button"
                            disabled={downloadBusyPath === artifact.path}
                            onClick={() => void handleArtifactDownload(artifact)}
                            className="mt-3 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {downloadBusyPath === artifact.path ? "Downloading..." : "Download"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Execution trace</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Steps, tools, and validation</h3>
                <div className="mt-5 grid gap-4">
                  <TracePanel title="Step logs" events={run.stepLogs} />
                  <TracePanel title="Tool events" events={run.toolEvents} />
                  <TracePanel title="Retrieval events" events={run.retrievalEvents} />
                  <TracePanel title="Validation events" events={run.validationEvents} />
                  <TracePanel title="Source trace" events={run.sourceTraceEvents} />
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Run chain</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Parent and child runs</h3>
                {chainError ? (
                  <p className="mt-4 text-sm text-rose-700">{chainError}</p>
                ) : !hasChainLinks ? (
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    This run is not linked to a parent or child chain.
                  </p>
                ) : (
                  <div className="mt-5 space-y-4">
                    {chain?.parentRun ? (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Parent</p>
                        <ChainNodeCard node={chain.parentRun} />
                      </div>
                    ) : null}
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">This run</p>
                      <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-900">
                        {jobLabel} · {run.id}
                      </div>
                    </div>
                    {(chain?.childRuns?.length ?? 0) > 0 ? (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Children</p>
                        <div className="space-y-3">
                          {chain?.childRuns.map((child) => (
                            <ChainNodeCard key={child.runId} node={child} />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Run not found</h2>
            <p className="mt-2 text-sm text-slate-600">
              We could not find a run with that id, or you do not have access to it.
            </p>
            <Link
              href="/context-jobs/runs"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Back to runs
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContextJobRunDetailPage() {
  const params = useParams<{ runId?: string | string[] }>();
  const runId = normalizeRunId(params?.runId);

  if (!runId) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_42%),linear-gradient(180deg,_#f7fcfc_0%,_#f4f8f8_100%)]">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
              <h1 className="text-2xl font-semibold text-amber-950">Missing run id</h1>
              <p className="mt-2 text-sm leading-6 text-amber-900/80">
                The run id could not be read from the route, so the detail view cannot load yet.
              </p>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <ContextJobRunDetailContent runId={runId} />
    </AuthGuard>
  );
}
