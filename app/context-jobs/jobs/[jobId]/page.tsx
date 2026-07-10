"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/shared/components/auth/AuthGuard";
import {
  getContextJob,
  getContextJobStats,
  getContextJobPublishHistory,
  getContextJobVersions,
  ingestContextJob,
  ingestContextJobUpload,
  rollbackContextJob,
  startContextJobRun,
  type ContextJob,
  type ContextJobIngestionResponse,
  type ContextJobIngestionUploadResponse,
  type ContextJobStats,
  type ContextJobPublishHistoryItem,
  type ContextJobVersion,
} from "@/shared/api/contextJobs";
import { useAuth } from "@/shared/context/AuthContext";
import { useContextJobsEntitlements } from "@/shared/hooks/useContextJobsEntitlements";

const fieldCardClass = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";

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

  return new Intl.NumberFormat([], {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSeconds(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0s";
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)}s`;
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

function getVersionSnapshotSummary(snapshot: Record<string, unknown> | null | undefined): Array<{ label: string; value: string }> {
  if (!snapshot || typeof snapshot !== "object") {
    return [];
  }

  const record = snapshot as Record<string, unknown>;
  const toolPermissionsCount = Array.isArray(record.toolPermissions) ? record.toolPermissions.length : 0;
  const trustedSourcesCount = Array.isArray(record.trustedSources) ? record.trustedSources.length : 0;
  const glossaryTermsCount = Array.isArray(record.glossaryTerms) ? record.glossaryTerms.length : 0;
  const relationshipsCount = Array.isArray(record.relationships) ? record.relationships.length : 0;
  const validationRulesCount = Array.isArray(record.validationRules) ? record.validationRules.length : 0;
  const memoryConfig = record.memoryConfig && typeof record.memoryConfig === "object" ? record.memoryConfig : null;
  const memoryEnabled = memoryConfig ? Object.keys(memoryConfig).length > 0 : false;

  return [
    { label: "Workflow type", value: typeof record.workflowType === "string" ? record.workflowType : "Not set" },
    { label: "Retrieval mode", value: typeof record.retrievalMode === "string" ? record.retrievalMode : "Not set" },
    { label: "Execution provider", value: typeof record.executionProvider === "string" ? record.executionProvider : "Not set" },
    { label: "Execution model", value: typeof record.executionModel === "string" ? record.executionModel : "Not set" },
    { label: "Execution mode", value: typeof record.executionMode === "string" ? record.executionMode : "Not set" },
    {
      label: "Max agent turns",
      value: typeof record.maxAgentTurns === "number" ? String(record.maxAgentTurns) : "Not set",
    },
    {
      label: "Approval required",
      value: typeof record.approvalRequired === "boolean" ? (record.approvalRequired ? "Yes" : "No") : "Not set",
    },
    { label: "Memory", value: memoryEnabled ? "On" : "Off" },
    { label: "Tool permissions", value: toolPermissionsCount > 0 ? `${toolPermissionsCount} tools` : "Not set" },
    { label: "Trusted sources", value: trustedSourcesCount > 0 ? `${trustedSourcesCount} sources` : "Not set" },
    { label: "Glossary terms", value: glossaryTermsCount > 0 ? `${glossaryTermsCount} terms` : "Not set" },
    { label: "Relationships", value: relationshipsCount > 0 ? `${relationshipsCount} relationships` : "Not set" },
    { label: "Validation rules", value: validationRulesCount > 0 ? `${validationRulesCount} rules` : "Not set" },
    {
      label: "Policy profile",
      value: typeof record.policyProfile === "string" && record.policyProfile.trim() ? record.policyProfile : "Not set",
    },
    {
      label: "Escalation policy",
      value: typeof record.escalationPolicy === "string" && record.escalationPolicy.trim() ? record.escalationPolicy : "Not set",
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
    return "Not set";
  }

  const matchesCurrentUser = creator === userId || creator === email;
  if (matchesCurrentUser) {
    return userName || email || "Current user";
  }

  if (!looksLikeOpaqueId(creator)) {
    return creator;
  }

  return "Another user";
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
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [ingestResult, setIngestResult] = useState<ContextJobIngestionResponse | ContextJobIngestionUploadResponse | null>(null);
  const [rollbackBusyVersion, setRollbackBusyVersion] = useState<number | null>(null);
  const [isVersionListOpen, setIsVersionListOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
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
    if (!versions.length) {
      setSelectedVersionId(null);
      return;
    }

    const sortedVersions = versions.slice().sort((a, b) => b.version - a.version);
    const selectedExists = selectedVersionId ? sortedVersions.some((version) => version.id === selectedVersionId) : false;

    if (!selectedVersionId || !selectedExists) {
      setSelectedVersionId(sortedVersions[0]?.id ?? null);
    }
  }, [selectedVersionId, versions]);

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
            metadata: {
              documentName,
            },
          },
        ],
      });

      setIngestResult(response);
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

      const response = await ingestContextJobUpload(job!.id, ingestFiles);
      setIngestResult(response);
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

  const handleRollback = async (versionNumber: number): Promise<void> => {
    if (!job) {
      return;
    }

    try {
      setRollbackBusyVersion(versionNumber);
      setHistoryError(null);
      const updatedJob = await rollbackContextJob(job.id, {
        version: versionNumber,
        notes: `Rolled back from version ${versionNumber} in the frontend`,
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
                      placeholder="What should this job do?"
                      className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                  </label>

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
                        ? "The app will create the run and move you to the live run detail page."
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
                    Paste a source excerpt or upload one or more documents. The job will ingest the content into its configured knowledge target.
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Target: {job.retrievalMode === "external" ? "External knowledge base" : "Jet KB"}
                </div>
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
                <div className="mt-4 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">
                        Ingestion {ingestResult.status || "completed"}
                      </p>
                      <p className="mt-1 text-sm text-emerald-800">
                        {ingestResult.outcome || "Content ingested successfully."}
                      </p>
                    </div>
                    {ingestResult.nextAction ? (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
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
              <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Performance snapshot</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">VIZ-7 metrics from the prototype</h3>
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

              <div className="space-y-4">
                <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Governance summary</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">VIZ-8 control details</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    These fields capture the lightweight governance context shown in the prototype: ownership, policy, and source trust.
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
                      <div className="space-y-3">
                        {latestVersion ? (
                          <div
                            className={`rounded-2xl border px-4 py-4 ${
                              selectedVersionId === latestVersion.id ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedVersionId(latestVersion.id)}
                              className="flex w-full flex-col gap-3 text-left sm:flex-row sm:items-start sm:justify-between"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-slate-900">Version {latestVersion.version}</p>
                                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Latest</span>
                                  {latestVersion.isCurrent ? (
                                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">Current</span>
                                  ) : null}
                                  {latestVersion.changeType ? (
                                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                                      {latestVersion.changeType}
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                  {formatMaybeDate(latestVersion.createdAt)}
                                  {latestVersion.createdBy ? ` - ${creatorLabel(latestVersion.createdBy)}` : ""}
                                </p>
                                <p className="mt-2 text-sm text-slate-700">
                                  {latestVersion.notes || (latestVersion.rollbackFromVersion ? `Rolled back from ${latestVersion.rollbackFromVersion}` : "No notes provided")}
                                </p>
                              </div>
                              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                {selectedVersionId === latestVersion.id ? "Selected" : "Inspect"}
                              </span>
                            </button>

                            {selectedVersionId === latestVersion.id ? (
                              <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="rounded-2xl bg-white px-4 py-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Created at</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatMaybeDate(latestVersion.createdAt)}</p>
                                  </div>
                                  <div className="rounded-2xl bg-white px-4 py-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Change type</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{latestVersion.changeType || "Not set"}</p>
                                  </div>
                                  <div className="rounded-2xl bg-white px-4 py-3">
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Rolled back from</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                      {latestVersion.rollbackFromVersion ? `Version ${latestVersion.rollbackFromVersion}` : "Not set"}
                                    </p>
                                  </div>
                                </div>

                                <div className="rounded-2xl bg-white px-4 py-3">
                                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</p>
                                  <p className="mt-1 text-sm leading-6 text-slate-700">
                                    {latestVersion.notes || (latestVersion.rollbackFromVersion ? `Rolled back from version ${latestVersion.rollbackFromVersion}` : "No notes provided")}
                                  </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Snapshot</p>
                                  <p className="mt-2 text-sm text-slate-600">A readable summary of the version configuration.</p>
                                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    {getVersionSnapshotSummary(latestVersion.jobSnapshot).map((item) => (
                                      <div key={item.label} className="rounded-2xl bg-white px-4 py-3">
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        <div className="rounded-2xl border border-slate-200 bg-white">
                          <button
                            type="button"
                            onClick={() => setIsVersionListOpen((current) => !current)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-900">All versions</p>
                              <p className="mt-0.5 text-xs text-slate-500">Click any version to inspect the full snapshot</p>
                            </div>
                            <span className={`text-slate-500 transition-transform ${isVersionListOpen ? "rotate-180" : ""}`}>v</span>
                          </button>

                          {isVersionListOpen ? (
                            <div className="space-y-3 border-t border-slate-200 p-4">
                              {sortedVersions.map((version) => {
                                const isSelected = selectedVersionId === version.id;
                                return (
                                  <div
                                    key={version.id}
                                    className={`rounded-2xl border px-4 py-4 ${
                                      isSelected ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-slate-50"
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setSelectedVersionId(version.id)}
                                      className="flex w-full flex-col gap-3 text-left sm:flex-row sm:items-start sm:justify-between"
                                    >
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="text-sm font-semibold text-slate-900">Version {version.version}</p>
                                          {version.id === latestVersion?.id ? (
                                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Latest</span>
                                          ) : null}
                                          {version.isCurrent ? (
                                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Current</span>
                                          ) : null}
                                          {version.changeType ? (
                                            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                                              {version.changeType}
                                            </span>
                                          ) : null}
                                          {isSelected ? (
                                            <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">Selected</span>
                                          ) : null}
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">
                                          {formatMaybeDate(version.createdAt)}
                                          {version.createdBy ? ` - ${creatorLabel(version.createdBy)}` : ""}
                                        </p>
                                        <p className="mt-2 text-sm text-slate-700">
                                          {version.notes || (version.rollbackFromVersion ? `Rolled back from ${version.rollbackFromVersion}` : "No notes provided")}
                                        </p>
                                      </div>

                                      <div className="flex shrink-0 items-center gap-2">
                                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                          {isSelected ? "Selected" : "Inspect"}
                                        </span>
                                        <span className="text-slate-500">v</span>
                                      </div>
                                    </button>

                                    {isSelected ? (
                                      <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
                                        <div className="grid gap-3 sm:grid-cols-2">
                                          <div className="rounded-2xl bg-white px-4 py-3">
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Created at</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900">{formatMaybeDate(version.createdAt)}</p>
                                          </div>
                                          <div className="rounded-2xl bg-white px-4 py-3">
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Change type</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900">{version.changeType || "Not set"}</p>
                                          </div>
                                          <div className="rounded-2xl bg-white px-4 py-3">
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Rolled back from</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                              {version.rollbackFromVersion ? `Version ${version.rollbackFromVersion}` : "Not set"}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="rounded-2xl bg-white px-4 py-3">
                                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Notes</p>
                                          <p className="mt-1 text-sm leading-6 text-slate-700">
                                            {version.notes || (version.rollbackFromVersion ? `Rolled back from version ${version.rollbackFromVersion}` : "No notes provided")}
                                          </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Snapshot</p>
                                          <p className="mt-2 text-sm text-slate-600">
                                            A readable summary of the version configuration.
                                          </p>
                                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                            {getVersionSnapshotSummary(version.jobSnapshot).map((item) => (
                                              <div key={item.label} className="rounded-2xl bg-white px-4 py-3">
                                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
                                                <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                          <p className="text-xs text-slate-500">
                                            Version {version.version} details are loaded from the saved snapshot.
                                          </p>
                                          <button
                                            type="button"
                                            disabled={version.isCurrent || rollbackBusyVersion === version.version}
                                            onClick={() => void handleRollback(version.version)}
                                            className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                          >
                                            {rollbackBusyVersion === version.version ? "Rolling back..." : "Rollback"}
                                          </button>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                        No version history returned yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Publish history</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">Status changes for this job</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {publishHistory.length} events
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {publishHistory.length ? (
                      publishHistory.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {item.fromStatus} → {item.toStatus}
                            </p>
                            {item.notes ? (
                              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                                notes
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatMaybeDate(item.changedAt)}
                            {item.changedBy ? ` · ${item.changedBy}` : ""}
                          </p>
                          <p className="mt-2 text-sm text-slate-700">
                            {item.notes || "No notes provided"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                        No publish history returned yet.
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
        <ContextJobDetailContent jobId={jobId} />
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


