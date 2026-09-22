"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AuthGuard from "@/shared/components/auth/AuthGuard";
import {
  getContextJob,
  getContextJobStats,
  getContextJobPublishHistory,
  getContextJobVersions,
  getContextJobsClmConnections,
  ingestContextJob,
  ingestContextJobFromClm,
  ingestContextJobUpload,
  rollbackContextJob,
  startContextJobRun,
  updateContextJob,
  type ContextJob,
  type ContextJobIngestionResponse,
  type ContextJobIngestionUploadResponse,
  type ContextJobStats,
  type ContextJobPublishHistoryItem,
  type ContextJobVersion,
  type ContextJobsClmConnection,
  type ContextJobsClmImportResult,
} from "@/shared/api/contextJobs";
import { useAuth } from "@/shared/context/AuthContext";
import { useContextJobsEntitlements } from "@/shared/hooks/useContextJobsEntitlements";

const fieldCardClass = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";

function isPolicyPlaceholderSource(source: unknown): boolean {
  if (!source || typeof source !== "object" || Array.isArray(source)) return false;
  const record = source as Record<string, unknown>;
  const id = String(record.id || "").toLowerCase();
  const label = String(record.label || record.name || "").toLowerCase();
  return id === "customer_policy" || label.includes("policy placeholder");
}

function jobHasPolicyPlaceholder(job: ContextJob): boolean {
  const config = job.retrievalConfig;
  if (!config || typeof config !== "object") return false;
  const sources = (config as Record<string, unknown>).knowledgeSources;
  if (!Array.isArray(sources)) return false;
  return sources.some((item) => isPolicyPlaceholderSource(item));
}

function stripPolicyPlaceholderFromJob(job: ContextJob): {
  retrievalConfig: Record<string, unknown>;
  validationRules: unknown[];
} {
  const config = { ...(job.retrievalConfig || {}) };
  const sources = Array.isArray(config.knowledgeSources) ? [...(config.knowledgeSources as unknown[])] : [];
  config.knowledgeSources = sources.filter((item) => !isPolicyPlaceholderSource(item));

  const rules = Array.isArray(job.validationRules) ? [...job.validationRules] : [];
  const nextRules = rules.filter((rule) => {
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) return true;
    const id = String((rule as Record<string, unknown>).id || "");
    return !id.startsWith("policy_");
  });

  return { retrievalConfig: config, validationRules: nextRules };
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function formatCurrency(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "$0.00";
  }

  const fractionDigits = value > 0 && value < 0.01 ? 4 : 2;

  return new Intl.NumberFormat([], {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

function formatSeconds(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0s";
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)}s`;
}

function isIngestFailure(result: ContextJobIngestionResponse): boolean {
  const status = String(result.status || "").toLowerCase();
  if (status === "failed" || status === "escalated" || status === "error") {
    return true;
  }
  if (result.error && String(result.error).trim()) {
    return true;
  }
  const outcome = String(result.outcome || "").toLowerCase();
  return outcome === "failed" || outcome === "blocked_by_policy";
}

function ingestFailureMessage(result: ContextJobIngestionResponse): string {
  const fromError = typeof result.error === "string" ? result.error.trim() : "";
  if (fromError) return fromError;
  const fromNext = result.nextAction?.label?.trim();
  if (fromNext) return fromNext;
  const outcome = typeof result.outcome === "string" ? result.outcome.trim() : "";
  if (outcome && outcome.toLowerCase() !== "failed") return outcome;
  return "Ingestion failed. Check your vector connection and try again.";
}

function formatPercent(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0%";
  }

  const normalized = value > 1 ? value : value * 100;
  return `${normalized.toFixed(normalized >= 10 ? 0 : 1)}%`;
}

function countItems(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function formatMaybeDate(value: string | null | undefined): string {
  if (!value) return "Not set";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function snapshotField(
  record: Record<string, unknown>,
  camelKey: string,
  snakeKey: string,
): unknown {
  if (camelKey in record) {
    return record[camelKey];
  }
  if (snakeKey in record) {
    return record[snakeKey];
  }
  return undefined;
}

function snapshotString(
  record: Record<string, unknown>,
  camelKey: string,
  snakeKey: string,
): string | null {
  const value = snapshotField(record, camelKey, snakeKey);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function snapshotArray(record: Record<string, unknown>, camelKey: string, snakeKey: string): unknown[] {
  const value = snapshotField(record, camelKey, snakeKey);
  return Array.isArray(value) ? value : [];
}

function snapshotNumber(record: Record<string, unknown>, camelKey: string, snakeKey: string): number | null {
  const value = snapshotField(record, camelKey, snakeKey);
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function snapshotBoolean(record: Record<string, unknown>, camelKey: string, snakeKey: string): boolean | null {
  const value = snapshotField(record, camelKey, snakeKey);
  return typeof value === "boolean" ? value : null;
}

function getVersionSnapshotSummary(snapshot: Record<string, unknown> | null | undefined): Array<{ label: string; value: string }> {
  if (!snapshot || typeof snapshot !== "object") {
    return [];
  }

  const record = snapshot as Record<string, unknown>;
  const toolPermissionsCount = snapshotArray(record, "toolPermissions", "tool_permissions").length;
  const trustedSourcesCount = snapshotArray(record, "trustedSources", "trusted_sources").length;
  const glossaryTermsCount = snapshotArray(record, "glossaryTerms", "glossary_terms").length;
  const relationshipsCount = snapshotArray(record, "relationships", "relationships").length;
  const validationRulesCount = snapshotArray(record, "validationRules", "validation_rules").length;
  const memoryConfig = snapshotField(record, "memoryConfig", "memory_config");
  const memoryEnabled =
    memoryConfig && typeof memoryConfig === "object" && !Array.isArray(memoryConfig)
      ? Object.keys(memoryConfig as Record<string, unknown>).length > 0
      : false;
  const approvalRequired = snapshotBoolean(record, "approvalRequired", "approval_required");
  const maxAgentTurns = snapshotNumber(record, "maxAgentTurns", "max_agent_turns");

  return [
    {
      label: "Workflow type",
      value: snapshotString(record, "workflowType", "workflow_type") ?? "Not set",
    },
    {
      label: "Retrieval mode",
      value: snapshotString(record, "retrievalMode", "retrieval_mode") ?? "Not set",
    },
    {
      label: "Execution provider",
      value: snapshotString(record, "executionProvider", "execution_provider") ?? "Not set",
    },
    {
      label: "Execution model",
      value: snapshotString(record, "executionModel", "execution_model") ?? "Not set",
    },
    {
      label: "Execution mode",
      value: snapshotString(record, "executionMode", "execution_mode") ?? "Not set",
    },
    {
      label: "Max agent turns",
      value: maxAgentTurns !== null ? String(maxAgentTurns) : "Not set",
    },
    {
      label: "Approval required",
      value: approvalRequired === null ? "Not set" : approvalRequired ? "Yes" : "No",
    },
    { label: "Memory", value: memoryEnabled ? "On" : "Off" },
    {
      label: "Tool permissions",
      value: toolPermissionsCount > 0 ? `${toolPermissionsCount} tools` : "None configured",
    },
    {
      label: "Trusted sources",
      value: trustedSourcesCount > 0 ? `${trustedSourcesCount} sources` : "None configured",
    },
    {
      label: "Glossary terms",
      value: glossaryTermsCount > 0 ? `${glossaryTermsCount} terms` : "None configured",
    },
    {
      label: "Relationships",
      value: relationshipsCount > 0 ? `${relationshipsCount} relationships` : "None configured",
    },
    {
      label: "Validation rules",
      value: validationRulesCount > 0 ? `${validationRulesCount} rules` : "None configured",
    },
    {
      label: "Policy profile",
      value: snapshotString(record, "policyProfile", "policy_profile") ?? "Not set",
    },
    {
      label: "Escalation policy",
      value: snapshotString(record, "escalationPolicy", "escalation_policy") ?? "Not set",
    },
  ];
}

function formatRunLabel(runId: string, outcome: string | null | undefined): string {
  if (outcome && outcome.trim()) {
    return outcome
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  const shortId = runId.length > 8 ? runId.slice(0, 8) : runId;
  return `Run ${shortId}`;
}

function looksLikeOpaqueId(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed === "current_user") return true;
  if (trimmed.includes("@") || trimmed.includes(" ")) return false;
  return /^[a-z0-9_-]{16,}$/i.test(trimmed) || trimmed.length >= 20;
}

function resolveOwnerLabel(owner: string | null | undefined, userName: string | null | undefined, userId: string | null | undefined, email: string | null | undefined): string {
  if (!owner) {
    return "Not set";
  }

  const matchesCurrentUser = owner === userId || owner === "current_user" || owner === email;
  if (matchesCurrentUser) {
    return userName || email || "Current user";
  }

  if (looksLikeOpaqueId(owner)) {
    return userName || email || "Current user";
  }

  return owner;
}

function resolveCreatorLabel(
  creator: string | null | undefined,
  userName: string | null | undefined,
  userId: string | null | undefined,
  email: string | null | undefined,
): string {
  if (!creator) {
    return "Unknown";
  }

  const matchesCurrentUser = creator === userId || creator === email;
  if (matchesCurrentUser) {
    return userName || email || "You";
  }

  if (!looksLikeOpaqueId(creator)) {
    return creator;
  }

  return "Another user";
}

function formatChangeType(changeType: string | null | undefined): string {
  if (!changeType?.trim()) {
    return "Revision";
  }

  return changeType.replace(/_/g, " ");
}

function versionSummaryLine(version: ContextJobVersion): string {
  if (version.notes?.trim()) {
    return version.notes.trim();
  }

  if (version.rollbackFromVersion) {
    return `Restored from version ${version.rollbackFromVersion}`;
  }

  switch (version.changeType) {
    case "create":
      return "Initial publish";
    case "save":
      return "Configuration saved";
    case "seed":
      return "Initial version seed";
    case "rollback":
      return "Rolled back to this revision";
    default:
      return "Revision recorded";
  }
}

function VersionHistoryItem({
  version,
  isLatest,
  isExpanded,
  onToggleExpand,
  onRollback,
  rollbackBusy,
  creatorLabel,
}: {
  version: ContextJobVersion;
  isLatest: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRollback: (versionNumber: number) => void;
  rollbackBusy: boolean;
  creatorLabel: (value: string | null | undefined) => string;
}) {
  const changeTypeLabel = formatChangeType(version.changeType);

  return (
    <div
      className={`rounded-2xl border px-4 py-4 ${
        version.isCurrent ? "border-teal-300 bg-teal-50/70" : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? `Collapse version ${version.version}` : `Expand version ${version.version}`}
          className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100"
        >
          <span className={`text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
        </button>

        <button
          type="button"
          onClick={onToggleExpand}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">Version {version.version}</p>
            {isLatest ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Latest</span>
            ) : null}
            {version.isCurrent ? (
              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">Current</span>
            ) : null}
            {version.changeType ? (
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-600">
                {changeTypeLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {formatMaybeDate(version.createdAt)}
            {version.createdBy ? ` · ${creatorLabel(version.createdBy)}` : ""}
          </p>
          <p className="mt-2 text-sm text-slate-700">{versionSummaryLine(version)}</p>
        </button>
      </div>

      {isExpanded ? (
        <div className="mt-4 space-y-4 border-t border-slate-200 pt-4 pl-11">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Created at</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatMaybeDate(version.createdAt)}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Change type</p>
              <p className="mt-1 text-sm font-semibold capitalize text-slate-900">{changeTypeLabel}</p>
            </div>
            {version.rollbackFromVersion ? (
              <div className="rounded-2xl bg-white px-4 py-3 sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Rolled back from</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">Version {version.rollbackFromVersion}</p>
              </div>
            ) : null}
          </div>

          {version.notes?.trim() ? (
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{version.notes.trim()}</p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Snapshot</p>
            <p className="mt-2 text-sm text-slate-600">Key settings captured in this revision.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {getVersionSnapshotSummary(version.jobSnapshot).map((item) => (
                <div key={item.label} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Rollback restores this revision&apos;s saved configuration as the live job.
            </p>
            <button
              type="button"
              disabled={Boolean(version.isCurrent) || rollbackBusy}
              onClick={() => onRollback(version.version)}
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {rollbackBusy ? "Rolling back..." : "Rollback to this version"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PublishHistoryPanel({
  items,
  isLoading,
}: {
  items: ContextJobPublishHistoryItem[];
  isLoading: boolean;
}) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Publish history</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">Status changes for this job</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {items.length} events
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            Loading publish history...
          </div>
        ) : items.length ? (
          items.map((item) => {
            const isExpanded = Boolean(expandedIds[item.id]);
            return (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(item.id)}
                    aria-expanded={isExpanded}
                    className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    <span className={`text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                  </button>
                  <button type="button" onClick={() => toggleExpanded(item.id)} className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.fromStatus} → {item.toStatus}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatMaybeDate(item.changedAt)}
                      {item.changedBy ? ` · ${item.changedBy}` : ""}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {item.notes?.trim() || "Status change recorded"}
                    </p>
                  </button>
                </div>
                {isExpanded && item.notes?.trim() ? (
                  <div className="mt-4 border-t border-slate-200 pt-4 pl-11">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{item.notes.trim()}</p>
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            No publish history yet. Status changes will appear here after publish or archive actions.
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeJobId(jobIdParam: string | string[] | undefined): string | null {
  if (typeof jobIdParam === "string" && jobIdParam.trim()) {
    return jobIdParam;
  }

  if (Array.isArray(jobIdParam) && typeof jobIdParam[0] === "string" && jobIdParam[0].trim()) {
    return jobIdParam[0];
  }

  return null;
}

function ContextJobDetailContent({ jobId }: { jobId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightedRunId = searchParams.get("runId");
  const latestRunsRef = useRef<HTMLElement | null>(null);
  const { user } = useAuth();
  const entitlements = useContextJobsEntitlements();
  const [job, setJob] = useState<ContextJob | null>(null);
  const [stats, setStats] = useState<ContextJobStats | null>(null);
  const [versions, setVersions] = useState<ContextJobVersion[]>([]);
  const [publishHistory, setPublishHistory] = useState<ContextJobPublishHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [runRequest, setRunRequest] = useState("");
  const [isStartingRun, setIsStartingRun] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [ingestText, setIngestText] = useState("");
  const [ingestFileName, setIngestFileName] = useState<string | null>(null);
  const [ingestFiles, setIngestFiles] = useState<File[]>([]);
  const [ingestMetaDraft, setIngestMetaDraft] = useState({ key: "", value: "" });
  const [ingestMetadataPairs, setIngestMetadataPairs] = useState<Array<{ key: string; value: string }>>([]);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [ingestResult, setIngestResult] = useState<ContextJobIngestionResponse | ContextJobIngestionUploadResponse | null>(null);
  const [clmConnections, setClmConnections] = useState<ContextJobsClmConnection[]>([]);
  const [clmConnectionId, setClmConnectionId] = useState("");
  const [clmUrl, setClmUrl] = useState("");
  const [isImportingClm, setIsImportingClm] = useState(false);
  const [clmImportError, setClmImportError] = useState<string | null>(null);
  const [clmImportResult, setClmImportResult] = useState<ContextJobsClmImportResult | null>(null);
  const [rollbackBusyVersion, setRollbackBusyVersion] = useState<number | null>(null);
  const [expandedVersionIds, setExpandedVersionIds] = useState<Record<string, boolean>>({});
  const [isRemovingPolicyPlaceholder, setIsRemovingPolicyPlaceholder] = useState(false);
  const [policyPlaceholderFeedback, setPolicyPlaceholderFeedback] = useState<string | null>(null);
  const ingestFileInputRef = useRef<HTMLInputElement | null>(null);

  const loadJob = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      setStatsError(null);
      setNotFound(false);

      const [jobResult, statsResult] = await Promise.allSettled([
        getContextJob(jobId),
        getContextJobStats(jobId),
      ]);

      if (jobResult.status === "fulfilled") {
        setJob(jobResult.value);
      } else {
        const statusCode = typeof jobResult.reason === "object" && jobResult.reason && "statusCode" in jobResult.reason
          ? Number((jobResult.reason as { statusCode?: number }).statusCode)
          : undefined;

        if (statusCode === 404) {
          setNotFound(true);
          return;
        }

        setError(jobResult.reason instanceof Error ? jobResult.reason.message : "Failed to load job");
        return;
      }

      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value);
      } else {
        setStatsError(statsResult.reason instanceof Error ? statsResult.reason.message : "Failed to load job stats");
      }
    } catch (err) {
      const statusCode = typeof err === "object" && err && "statusCode" in err
        ? Number((err as { statusCode?: number }).statusCode)
        : undefined;

      if (statusCode === 404) {
        setNotFound(true);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load job");
      }
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  const loadHistory = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingHistory(true);
      setHistoryError(null);
      const [versionsResult, historyResult] = await Promise.allSettled([
        getContextJobVersions(jobId),
        getContextJobPublishHistory(jobId),
      ]);

      if (versionsResult.status === "fulfilled") {
        setVersions(versionsResult.value);
      } else {
        setVersions([]);
        setHistoryError(versionsResult.reason instanceof Error ? versionsResult.reason.message : "Failed to load version history");
      }

      if (historyResult.status === "fulfilled") {
        setPublishHistory(historyResult.value);
      } else {
        setPublishHistory([]);
        setHistoryError(historyResult.reason instanceof Error ? historyResult.reason.message : "Failed to load publish history");
      }
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Failed to load job history");
    } finally {
      setIsLoadingHistory(false);
    }
  }, [jobId]);

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    let cancelled = false;
    const loadClmConnections = async (): Promise<void> => {
      try {
        const connections = await getContextJobsClmConnections();
        if (cancelled) return;
        const active = connections.filter((item) => (item.status || "active") === "active");
        setClmConnections(active);
        setClmConnectionId((current) => {
          if (current && active.some((item) => item.id === current)) return current;
          return active[0]?.id || "";
        });
      } catch {
        if (cancelled) return;
        setClmConnections([]);
        setClmConnectionId("");
      }
    };
    void loadClmConnections();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!highlightedRunId) return;
    latestRunsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [highlightedRunId, stats]);

  const toggleVersionExpanded = (versionId: string) => {
    setExpandedVersionIds((current) => ({ ...current, [versionId]: !current[versionId] }));
  };

  const glossaryTermsCount = countItems(job?.glossaryTerms);
  const relationshipsCount = countItems(job?.relationships);
  const trustedSourcesCount = countItems(job?.trustedSources);
  const toolPermissionsCount = countItems(job?.toolPermissions);
  const validationRulesCount = countItems(job?.validationRules);
  const memoryEnabled = job?.memoryConfig ? Object.keys(job.memoryConfig).length > 0 : false;
  const ownerLabel = resolveOwnerLabel(job?.owner, user?.name || null, user?.user_id || user?.id || null, user?.email || null);
  const creatorLabel = (value: string | null | undefined) =>
    resolveCreatorLabel(value, user?.name || null, user?.user_id || user?.id || null, user?.email || null);
  const canRun = entitlements.status === "succeeded" ? entitlements.canCreateRun : false;
  const sortedVersions = versions.slice().sort((a, b) => b.version - a.version);
  const latestVersion = sortedVersions[0] ?? null;
  const governanceItems = [
    { label: "Owner", value: ownerLabel },
    { label: "Version", value: job ? `v${job.version}` : "Not set" },
    { label: "Created", value: formatMaybeDate(job?.createdAt) },
    { label: "Updated", value: formatMaybeDate(job?.updatedAt) },
    { label: "Approval", value: job?.approvalRequired ? "Required" : "Not required" },
    { label: "Policy profile", value: job?.policyProfile || "Not set" },
    { label: "Escalation", value: job?.escalationPolicy || "Not set" },
    { label: "Trusted sources", value: trustedSourcesCount > 0 ? `${trustedSourcesCount} trusted source${trustedSourcesCount === 1 ? "" : "s"}` : "Not set" },
  ];

  const handleStartRun = async (): Promise<void> => {
    if (!job || !runRequest.trim()) {
      setRunError("Add a user request before starting a run.");
      return;
    }

    try {
      setIsStartingRun(true);
      setRunError(null);
      const started = await startContextJobRun(job.id, runRequest.trim());
      router.push(`/context-jobs/runs/${started.id}`);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Failed to start run");
    } finally {
      setIsStartingRun(false);
    }
  };

  const buildIngestMetadata = (documentName: string): Record<string, string> => {
    const metadata: Record<string, string> = { documentName };
    for (const pair of ingestMetadataPairs) {
      const key = pair.key.trim();
      const value = pair.value.trim();
      if (key && value) {
        metadata[key] = value;
      }
    }
    return metadata;
  };

  const submitIngestion = async (documentText: string, documentName: string): Promise<void> => {
    if (!job) {
      return;
    }

    const trimmedText = documentText.trim();
    if (!trimmedText) {
      setIngestError("Add some text or choose a file before ingesting.");
      return;
    }

    try {
      setIsIngesting(true);
      setIngestError(null);
      setIngestResult(null);

      const response = await ingestContextJob(job.id, {
        documents: [
          {
            text: trimmedText,
            metadata: buildIngestMetadata(documentName),
          },
        ],
      });

      setIngestResult(response);
      if (isIngestFailure(response)) {
        return;
      }

      setIngestText("");
      setIngestFiles([]);
      setIngestFileName(null);

      if (ingestFileInputRef.current) {
        ingestFileInputRef.current.value = "";
      }
    } catch (err) {
      setIngestError(err instanceof Error ? err.message : "Failed to ingest content");
    } finally {
      setIsIngesting(false);
    }
  };

  const handleIngestText = async (): Promise<void> => {
    await submitIngestion(ingestText, "Pasted text");
  };

  const handleIngestFile = async (): Promise<void> => {
    if (!ingestFiles.length) {
      setIngestError("Choose one or more files before ingesting.");
      return;
    }

    try {
      setIsIngesting(true);
      setIngestError(null);
      setIngestResult(null);

      const response = await ingestContextJobUpload(
        job!.id,
        ingestFiles,
        Object.fromEntries(
          ingestMetadataPairs
            .filter((pair) => pair.key.trim() && pair.value.trim())
            .map((pair) => [pair.key.trim(), pair.value.trim()]),
        ),
      );
      setIngestResult(response);
      if (isIngestFailure(response)) {
        return;
      }

      setIngestFiles([]);
      setIngestFileName(null);

      if (ingestFileInputRef.current) {
        ingestFileInputRef.current.value = "";
      }
    } catch (err) {
      setIngestError(err instanceof Error ? err.message : "Failed to ingest files");
    } finally {
      setIsIngesting(false);
    }
  };

  const handleIngestFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(event.target.files ?? []);
    setIngestError(null);
    setIngestResult(null);
    setIngestFiles(files);
    setIngestFileName(files.length ? `${files.length} file${files.length === 1 ? "" : "s"} selected` : null);
  };

  const handleClmImport = async (): Promise<void> => {
    if (!job) return;
    if (!clmConnectionId) {
      setClmImportError("Select a Coupa or Ironclad connection first (or add one under CLM).");
      return;
    }
    if (!clmUrl.trim()) {
      setClmImportError("Paste a Coupa or Ironclad contract URL (or resource ID).");
      return;
    }

    try {
      setIsImportingClm(true);
      setClmImportError(null);
      setClmImportResult(null);
      const metadata = Object.fromEntries(
        ingestMetadataPairs
          .filter((pair) => pair.key.trim() && pair.value.trim())
          .map((pair) => [pair.key.trim(), pair.value.trim()]),
      );
      const response = await ingestContextJobFromClm(job.id, {
        connectionId: clmConnectionId,
        url: clmUrl.trim(),
        ...(Object.keys(metadata).length ? { metadata } : {}),
      });
      setClmImportResult(response);
      setClmUrl("");
      await loadJob();
    } catch (err) {
      setClmImportError(err instanceof Error ? err.message : "Failed to import from CLM");
    } finally {
      setIsImportingClm(false);
    }
  };

  const handleRemovePolicyPlaceholder = async (): Promise<void> => {
    if (!job || !jobHasPolicyPlaceholder(job)) return;
    setIsRemovingPolicyPlaceholder(true);
    setPolicyPlaceholderFeedback(null);
    setError(null);
    try {
      const next = stripPolicyPlaceholderFromJob(job);
      const updated = await updateContextJob(job.id, {
        retrievalConfig: next.retrievalConfig,
        validationRules: next.validationRules,
      });
      setJob(updated);
      setPolicyPlaceholderFeedback(
        "Generic template policy removed from this job. Your ingested policy documents in the knowledge base are unchanged.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove template policy");
    } finally {
      setIsRemovingPolicyPlaceholder(false);
    }
  };

  const handleRollback = async (versionNumber: number): Promise<void> => {
    if (!job) {
      return;
    }

    try {
      setRollbackBusyVersion(versionNumber);
      setHistoryError(null);
      const updatedJob = await rollbackContextJob(job.id, {
        version: versionNumber,
        notes: `Restored version ${versionNumber} from job detail`,
      });
      setJob(updatedJob);
      await Promise.all([loadJob(), loadHistory()]);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Failed to roll back job");
    } finally {
      setRollbackBusyVersion(null);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_42%),linear-gradient(180deg,_#f7fcfc_0%,_#f4f8f8_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link href="/context-jobs/jobs" className="text-sm font-medium text-teal-700 hover:text-teal-900">
              Back to jobs
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Job details
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center rounded-3xl border border-white/70 bg-white/80 py-16 shadow-sm backdrop-blur">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent" />
              <p className="mt-4 text-sm text-slate-600">Loading job...</p>
            </div>
          </div>
        ) : notFound ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Job not found</h2>
            <p className="mt-2 text-sm text-slate-600">
              We could not find a job with that id, or you do not have access to it.
            </p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : job ? (
          <div className="space-y-6">
            <section className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold text-slate-900">{job.name}</h2>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                      {job.status}
                    </span>
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                      v{job.version}
                    </span>
                  </div>
                  <p className="max-w-3xl text-sm leading-6 text-slate-600">
                    {job.goal || job.description || "No goal or description is set yet."}
                  </p>
                </div>

                <div className="grid w-full gap-2 text-sm text-slate-700 lg:w-80">
                  <div className={fieldCardClass}>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Execution</p>
                    <p className="mt-1 break-words font-medium text-slate-900">
                      {job.executionProvider} / {job.executionModel}
                    </p>
                  </div>
                  <div className={fieldCardClass}>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Workflow type</p>
                    <p className="mt-1 font-medium text-slate-900">{job.workflowType}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/context-jobs/jobs/${job.id}/edit`}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  Edit job
                </Link>
                <Link
                  href="/context-jobs/jobs"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
                >
                  Back to jobs
                </Link>
              </div>
            </section>

            <section
              ref={latestRunsRef}
              className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Completed work</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Runs for this job</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    Opening this job shows the work already run here. Start another request only if you need a new execution.
                  </p>
                </div>
                <Link
                  href="/context-jobs/runs"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
                >
                  View all runs
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {stats?.recentRuns?.length ? (
                  stats.recentRuns.map((recentRun) => {
                    const isHighlighted = highlightedRunId === recentRun.runId;
                    return (
                      <Link
                        key={recentRun.runId}
                        href={`/context-jobs/runs/${recentRun.runId}`}
                        className={`block rounded-2xl border px-4 py-4 transition-colors ${
                          isHighlighted
                            ? "border-teal-400 bg-teal-50 ring-2 ring-teal-200"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">
                            {isHighlighted ? "Run you just opened · " : ""}
                            {formatRunLabel(recentRun.runId, recentRun.outcome)}
                          </p>
                          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            {recentRun.state}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          Started {recentRun.startedAt ? new Date(recentRun.startedAt).toLocaleString() : "Not set"}
                          {recentRun.endedAt ? ` · Ended ${new Date(recentRun.endedAt).toLocaleString()}` : ""}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-teal-800">Open this run</p>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-sm leading-6 text-slate-600">
                    No runs yet. Use the launcher below to start the first one.
                  </p>
                )}
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <div className={fieldCardClass}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Terms</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{glossaryTermsCount}</p>
              </div>
              <div className={fieldCardClass}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Relationships</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{relationshipsCount}</p>
              </div>
              <div className={fieldCardClass}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sources</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{trustedSourcesCount}</p>
              </div>
              <div className={fieldCardClass}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Tools</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{toolPermissionsCount}</p>
              </div>
              <div className={fieldCardClass}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Checks</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{validationRulesCount}</p>
              </div>
              <div className={fieldCardClass}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Memory</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{memoryEnabled ? "Enabled" : "Not set"}</p>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className={fieldCardClass}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Goal</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                  {formatValue(job.goal)}
                </p>
              </div>
              <div className={fieldCardClass}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Description</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                  {formatValue(job.description)}
                </p>
              </div>
              <div className={fieldCardClass}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Execution provider</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{job.executionProvider}</p>
              </div>
              <div className={fieldCardClass}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Execution model</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{job.executionModel}</p>
              </div>
              <div className={fieldCardClass}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Retrieval mode</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{formatValue(job.retrievalMode)}</p>
              </div>
              <div className={fieldCardClass}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Version</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{job.version}</p>
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Run launcher</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Start a new run from this job</h3>
                  </div>
                  <Link
                    href="/context-jobs/runs"
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
                  >
                    View all runs
                  </Link>
                </div>

                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">User request</span>
                    <textarea
                      value={runRequest}
                      onChange={(event) => setRunRequest(event.target.value)}
                      placeholder={
                        job.workflowType === "contract_review"
                          ? "Review Acme MSA renewal — vendor Acme Cloud, expiry 2026-12-31. Or paste a public contract URL here for contract-analyzer."
                          : "What should this job do?"
                      }
                      className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                  </label>

                  {job.workflowType === "contract_review" ? (
                    <p className="text-sm leading-6 text-slate-600">
                      Contract review runs without blocking on an empty KB, but grounded results need contract
                      evidence. Ingest contract + policy below, or put a contract URL / pasted text in User request
                      above. Vendor and expiry in the request help retrieval scope when KB metadata exists.
                    </p>
                  ) : null}

                  {jobHasPolicyPlaceholder(job) ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-medium text-amber-950">Template policy is still wired</p>
                      <p className="mt-1 text-sm leading-6 text-amber-900/80">
                        This job includes the generic Policy Placeholder from the template. If you ingest your own
                        policy into the knowledge base, leave this in place and both can mix in retrieval. Remove it
                        when you want runs to use only your ingested policy.
                      </p>
                      {policyPlaceholderFeedback ? (
                        <p className="mt-2 text-sm text-emerald-800">{policyPlaceholderFeedback}</p>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void handleRemovePolicyPlaceholder()}
                        disabled={isRemovingPolicyPlaceholder}
                        className="mt-3 inline-flex items-center justify-center rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-950 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isRemovingPolicyPlaceholder ? "Removing..." : "Remove Policy Placeholder"}
                      </button>
                    </div>
                  ) : null}

                  {runError ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
                      <p className="text-sm font-medium">{runError}</p>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => void handleStartRun()}
                      disabled={isStartingRun || !canRun}
                      className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isStartingRun ? "Starting..." : "Run now"}
                    </button>
                    <p className="text-xs text-slate-500">
                      {canRun
                        ? "The app will create the run and take you to the runs list, where status updates live."
                        : "Run creation is disabled for your current plan."}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Ingestion</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Add text content to this job</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    Paste or upload documents into this job&apos;s knowledge target ({job.retrievalMode === "external" ? "your vector connection" : "Jet managed KB — shared for your workspace, not isolated per job"}).
                    Ingestion chunks text, infers metadata (document type, vendor, expiry when detectable), and embeds for retrieval on future runs.
                    Stamp your own metadata keys below (for example <span className="font-medium text-slate-800">contractId</span>) and reuse the same key/value in the job&apos;s Trusted sources so retrieval stays scoped.
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Target: {job.retrievalMode === "external" ? "External knowledge base (vector connection)" : "Managed knowledge base (Jet KB)"}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-medium text-slate-800">Ingest metadata (optional)</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Applied to both pasted text and uploads. Use the same keys later in Trusted sources.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Key (e.g. contractId)"
                    value={ingestMetaDraft.key}
                    onChange={(event) => setIngestMetaDraft((current) => ({ ...current, key: event.target.value }))}
                  />
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Value (e.g. ACME-MSA-2024-001)"
                    value={ingestMetaDraft.value}
                    onChange={(event) => setIngestMetaDraft((current) => ({ ...current, value: event.target.value }))}
                  />
                  <button
                    type="button"
                    className="rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                    disabled={!ingestMetaDraft.key.trim() || !ingestMetaDraft.value.trim()}
                    onClick={() => {
                      const key = ingestMetaDraft.key.trim();
                      const value = ingestMetaDraft.value.trim();
                      if (!key || !value) return;
                      setIngestMetadataPairs((current) => {
                        const without = current.filter((pair) => pair.key.toLowerCase() !== key.toLowerCase());
                        return [...without, { key, value }];
                      });
                      setIngestMetaDraft({ key: "", value: "" });
                    }}
                  >
                    Add
                  </button>
                </div>
                {ingestMetadataPairs.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ingestMetadataPairs.map((pair) => (
                      <button
                        key={pair.key}
                        type="button"
                        onClick={() =>
                          setIngestMetadataPairs((current) => current.filter((item) => item.key !== pair.key))
                        }
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                      >
                        {pair.key}={pair.value} ×
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Import from CLM</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Paste a Coupa <code className="rounded bg-slate-100 px-1">/contracts/show/{"{id}"}</code> or Ironclad{" "}
                      <code className="rounded bg-slate-100 px-1">/workflow/{"{id}"}</code> /{" "}
                      <code className="rounded bg-slate-100 px-1">/record/{"{id}"}</code> URL. Jet downloads the legal
                      agreement via your saved connection and ingests it here. Optional metadata above is applied too.
                    </p>
                  </div>
                  <Link
                    href="/context-jobs/clm-connections"
                    className="shrink-0 text-sm font-semibold text-teal-700 hover:text-teal-900"
                  >
                    Manage CLM
                  </Link>
                </div>

                {clmConnections.length ? (
                  <div className="mt-3 grid gap-3 lg:grid-cols-[0.9fr_1.4fr_auto]">
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium text-slate-600">Connection</span>
                      <select
                        value={clmConnectionId}
                        onChange={(event) => {
                          setClmConnectionId(event.target.value);
                          setClmImportError(null);
                          setClmImportResult(null);
                        }}
                        disabled={isImportingClm}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {clmConnections.map((connection) => (
                          <option key={connection.id} value={connection.id}>
                            {(connection.name || "Unnamed") + ` (${connection.provider || "clm"})`}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium text-slate-600">Contract URL or ID</span>
                      <input
                        value={clmUrl}
                        onChange={(event) => {
                          setClmUrl(event.target.value);
                          setClmImportError(null);
                          setClmImportResult(null);
                        }}
                        placeholder="https://acme.coupa.com/contracts/show/12345"
                        disabled={isImportingClm}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </label>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => void handleClmImport()}
                        disabled={isImportingClm || isIngesting || !clmConnectionId || !clmUrl.trim()}
                        className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 lg:w-auto"
                      >
                        {isImportingClm ? "Importing..." : "Import & ingest"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    No active CLM connections.{" "}
                    <Link href="/context-jobs/clm-connections" className="font-semibold text-teal-700 hover:text-teal-900">
                      Add Coupa or Ironclad
                    </Link>{" "}
                    to import contracts by URL.
                  </div>
                )}

                {clmImportError ? (
                  <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-800">
                    <p className="text-sm font-medium">{clmImportError}</p>
                  </div>
                ) : null}

                {clmImportResult ? (
                  <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
                    <p className="text-sm font-medium">{clmImportResult.message || "Imported from CLM."}</p>
                    <p className="mt-1 text-xs text-emerald-800">
                      {clmImportResult.filename || "Document"} · {clmImportResult.provider || "clm"} ·{" "}
                      {clmImportResult.upsertedCount ?? 0} chunk{(clmImportResult.upsertedCount ?? 0) === 1 ? "" : "s"} ·{" "}
                      {clmImportResult.ingestionStatus || "completed"}
                    </p>
                    {clmImportResult.warnings?.length ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-900">
                        {clmImportResult.warnings.map((warning, index) => (
                          <li key={`${warning}-${index}`}>{warning}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Paste text</span>
                    <textarea
                      value={ingestText}
                      onChange={(event) => {
                        setIngestText(event.target.value);
                        setIngestError(null);
                        setIngestResult(null);
                      }}
                      placeholder="Paste the text you want to ingest into this job..."
                      className="min-h-48 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                  </label>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void handleIngestText()}
                      disabled={isIngesting || !ingestText.trim()}
                      className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isIngesting ? "Ingesting..." : "Ingest pasted text"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIngestText("");
                        setIngestError(null);
                        setIngestResult(null);
                      }}
                      disabled={isIngesting || (!ingestText && !ingestFiles.length)}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-medium text-slate-700">Upload text file</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Best for `.txt`, `.md`, `.json`, `.csv`, or `.log` files that can be read as text.
                  </p>

                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5">
                    <input
                      ref={ingestFileInputRef}
                      type="file"
                      accept=".txt,.md,.json,.csv,.log,.pdf,.docx"
                      onChange={handleIngestFileChange}
                      className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                      disabled={isIngesting}
                      multiple
                    />

                    <div className="mt-4 flex flex-col gap-3">
                      <p className="text-sm text-slate-700">
                        {ingestFileName ? (
                          <>
                            {ingestFileName}
                          </>
                        ) : (
                          "No file selected"
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleIngestFile()}
                        disabled={isIngesting || !ingestFiles.length}
                        className="inline-flex items-center justify-center rounded-full border border-teal-200 bg-teal-50 px-5 py-3 text-sm font-semibold text-teal-800 transition-colors hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isIngesting ? "Ingesting..." : "Ingest file"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIngestFiles([]);
                          setIngestFileName(null);
                          setIngestError(null);
                          setIngestResult(null);
                          if (ingestFileInputRef.current) {
                            ingestFileInputRef.current.value = "";
                          }
                        }}
                        disabled={isIngesting || !ingestFiles.length}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Clear file
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {ingestError ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
                  <p className="text-sm font-medium">{ingestError}</p>
                </div>
              ) : null}

              {ingestResult ? (
                <div
                  className={
                    isIngestFailure(ingestResult)
                      ? "mt-4 space-y-4 rounded-2xl border border-rose-200 bg-rose-50 p-4"
                      : "mt-4 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
                  }
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p
                        className={
                          isIngestFailure(ingestResult)
                            ? "text-sm font-semibold text-rose-900"
                            : "text-sm font-semibold text-emerald-900"
                        }
                      >
                        Ingestion {ingestResult.status || "completed"}
                      </p>
                      <p
                        className={
                          isIngestFailure(ingestResult)
                            ? "mt-1 text-sm text-rose-800"
                            : "mt-1 text-sm text-emerald-800"
                        }
                      >
                        {isIngestFailure(ingestResult)
                          ? ingestFailureMessage(ingestResult)
                          : ingestResult.outcome || "Content ingested successfully."}
                      </p>
                    </div>
                    {ingestResult.nextAction ? (
                      <span
                        className={
                          isIngestFailure(ingestResult)
                            ? "rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-800"
                            : "rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800"
                        }
                      >
                        Next: {ingestResult.nextAction.label || ingestResult.nextAction.type || "Continue"}
                      </span>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Upserted</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{ingestResult.upsertedCount ?? 0}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Failed</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{ingestResult.failedCount ?? 0}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Warnings</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{ingestResult.warnings?.length ?? 0}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sources</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{ingestResult.ingestedSources?.length ?? 0}</p>
                    </div>
                  </div>

                  {ingestResult.warnings?.length ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Warnings</p>
                      <ul className="mt-2 space-y-1 text-sm text-amber-900">
                        {ingestResult.warnings.map((warning, index) => (
                          <li key={`${warning}-${index}`}>- {warning}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {ingestResult.ingestedSources?.length ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ingested sources</p>
                      <div className="mt-2 space-y-2">
                        {ingestResult.ingestedSources.map((source, index) => (
                          <div key={`${source.documentName || "source"}-${index}`} className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">
                              {source.documentName || `Source ${index + 1}`}
                            </p>
                            <p className="text-sm text-slate-600">
                              {source.chunkCount ?? 0} chunks
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {"skipped" in ingestResult && Array.isArray(ingestResult.skipped) && ingestResult.skipped.length ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Skipped files</p>
                      <ul className="mt-2 space-y-1 text-sm text-amber-900">
                        {ingestResult.skipped.map((item, index) => (
                          <li key={`${item.documentName || "skipped"}-${index}`}>
                            <span className="font-semibold">{item.documentName || `File ${index + 1}`}</span>
                            {item.reason ? ` - ${item.reason}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Performance snapshot</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">Run performance metrics</h3>
                    </div>
                    <p className="text-sm text-slate-500">Stats from the latest run history</p>
                  </div>

                  {statsError ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                      <p className="text-sm font-medium">{statsError}</p>
                    </div>
                  ) : null}

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                      { label: "Total runs", value: stats?.totalRuns ?? 0 },
                      { label: "Completed", value: stats?.completedRuns ?? 0 },
                      { label: "Failed", value: stats?.failedRuns ?? 0 },
                      { label: "Completion rate", value: formatPercent(stats?.completionRate ?? 0) },
                      { label: "Warning rate", value: formatPercent(stats?.warningRate ?? 0) },
                      { label: "Review / escalation", value: formatPercent(stats?.reviewEscalationRate ?? 0) },
                      { label: "Avg runtime", value: formatSeconds(stats?.averageRuntimeSeconds ?? 0) },
                      { label: "Avg cost", value: formatCurrency(stats?.averageCost ?? 0) },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{metric.label}</p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{metric.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Recent runs</p>
                      <div className="mt-3 space-y-3">
                        {stats?.recentRuns?.length ? (
                          stats.recentRuns.map((run) => (
                            <Link
                              key={run.runId}
                              href={`/context-jobs/runs/${run.runId}`}
                              className="block rounded-2xl bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-slate-900">
                                  {formatRunLabel(run.runId, run.outcome)}
                                </p>
                                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{run.state}</span>
                              </div>
                              <p className="mt-1 break-all text-xs text-slate-500">{run.runId}</p>
                            </Link>
                          ))
                        ) : (
                          <p className="text-sm text-slate-600">No recent runs are available yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Top validation issues</p>
                      <div className="mt-3 space-y-3">
                        {stats?.topValidationFailures?.length ? (
                          stats.topValidationFailures.map((issue) => (
                            <div key={issue.message} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                              <p className="text-sm leading-6 text-slate-700">{issue.message}</p>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900">{issue.count}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-600">No validation issues were reported.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <PublishHistoryPanel items={publishHistory} isLoading={isLoadingHistory} />
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Governance summary</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Governance controls</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Ownership, policy, and source-trust settings for this job.
                  </p>

                  <div className="mt-5 space-y-3">
                    {governanceItems.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Version history</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">Published and edited revisions</h3>
                      <p className="mt-2 text-sm text-slate-600">
                        Expand any version to inspect its snapshot or roll back to it.
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {versions.length} versions
                    </span>
                  </div>

                  {historyError ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                      <p className="text-sm font-medium">{historyError}</p>
                    </div>
                  ) : null}

                  <div className="mt-5 space-y-3">
                    {isLoadingHistory ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                        Loading version history...
                      </div>
                    ) : sortedVersions.length ? (
                      sortedVersions.map((version) => (
                        <VersionHistoryItem
                          key={version.id}
                          version={version}
                          isLatest={version.id === latestVersion?.id}
                          isExpanded={Boolean(expandedVersionIds[version.id])}
                          onToggleExpand={() => toggleVersionExpanded(version.id)}
                          onRollback={(versionNumber) => void handleRollback(versionNumber)}
                          rollbackBusy={rollbackBusyVersion === version.version}
                          creatorLabel={creatorLabel}
                        />
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                        No version history returned yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ContextJobDetailPage() {
  const params = useParams<{ jobId?: string | string[] }>();
  const jobId = normalizeJobId(params?.jobId);

  return (
    <AuthGuard>
      {jobId ? (
        <Suspense
          fallback={
            <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_42%),linear-gradient(180deg,_#f7fcfc_0%,_#f4f8f8_100%)]">
              <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
                <p className="text-sm text-slate-600">Loading job...</p>
              </div>
            </div>
          }
        >
          <ContextJobDetailContent jobId={jobId} />
        </Suspense>
      ) : (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_42%),linear-gradient(180deg,_#f7fcfc_0%,_#f4f8f8_100%)]">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
              <h1 className="text-2xl font-semibold text-amber-950">Missing job id</h1>
              <p className="mt-2 text-sm leading-6 text-amber-900/80">
                The job id could not be read from the route, so the detail view cannot load yet.
              </p>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}


