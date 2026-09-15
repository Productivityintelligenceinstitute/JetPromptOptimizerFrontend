"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/shared/components/auth/AuthGuard";
import {
  getContextJobs,
  getContextJobsRunQueueStatus,
  getContextJobsRuns,
  startContextJobRun,
  type ContextJob,
  type ContextJobRun,
  type ContextJobsRunQueueStatus,
  type ContextJobRunStartResponse,
} from "@/shared/api/contextJobs";
import { useContextJobsEntitlements } from "@/shared/hooks/useContextJobsEntitlements";

const liveRunStates = new Set([
  "queued",
  "planning",
  "retrieving",
  "executing",
  "validating",
  "awaiting_tool_approval",
  "awaiting_memory_approval",
  "repair",
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

const stateOptions = ["all", ...Object.keys(stateMeta)] as const;
type RunStateFilter = (typeof stateOptions)[number];

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

function formatRunTitle(run: ContextJobRun): string {
  const outcome = run.outcome?.trim();
  if (outcome) {
    return outcome.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return `Run ${run.id.slice(0, 8)}`;
}

function getRunStateMeta(state: string) {
  return stateMeta[state] ?? {
    label: state.replace(/_/g, " ") || "Unknown",
    className: "bg-slate-100 text-slate-700",
    dotClass: "bg-slate-400",
  };
}

function ContextJobsRunsContent() {
  const router = useRouter();
  const entitlements = useContextJobsEntitlements();
  const [jobs, setJobs] = useState<ContextJob[]>([]);
  const [runs, setRuns] = useState<ContextJobRun[]>([]);
  const [queueStatus, setQueueStatus] = useState<ContextJobsRunQueueStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<RunStateFilter>("all");
  const [isRunComposerOpen, setIsRunComposerOpen] = useState(false);
  const [selectedRunJobId, setSelectedRunJobId] = useState("");
  const [runRequest, setRunRequest] = useState("");
  const [isStartingRun, setIsStartingRun] = useState(false);
  const [runComposerError, setRunComposerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollWarning, setPollWarning] = useState<string | null>(null);
  const [startedRunId, setStartedRunId] = useState<string | null>(null);
  const loadInFlightRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    const started = new URLSearchParams(window.location.search).get("started");
    if (started?.trim()) {
      setStartedRunId(started.trim());
    }
  }, []);

  const loadRuns = useCallback(async (opts?: { quiet?: boolean }): Promise<void> => {
    if (loadInFlightRef.current) {
      return;
    }

    if (entitlements.status === "failed") {
      setError("Failed to load Context Jobs access information.");
      setIsLoading(false);
      return;
    }

    if (entitlements.status !== "succeeded") {
      return;
    }

    if (!entitlements.contextJobsEnabled) {
      setIsLoading(false);
      return;
    }

    loadInFlightRef.current = true;
    const quiet = Boolean(opts?.quiet);
    try {
      if (!quiet) {
        setIsLoading(true);
      }
      const [runData, jobData, queueData] = await Promise.all([
        getContextJobsRuns(),
        getContextJobs(),
        getContextJobsRunQueueStatus(),
      ]);

      setRuns(runData);
      setJobs(jobData);
      setQueueStatus(queueData);
      hasLoadedOnceRef.current = true;
      setError(null);
      setPollWarning(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load runs";
      if (quiet && hasLoadedOnceRef.current) {
        setPollWarning("Live refresh delayed — retrying. In-progress runs may still be processing.");
      } else {
        setError(message);
      }
    } finally {
      loadInFlightRef.current = false;
      setIsLoading(false);
    }
  }, [entitlements.contextJobsEnabled, entitlements.status]);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  const hasLiveRuns = useMemo(
    () => runs.some((run) => liveRunStates.has(run.state)),
    [runs],
  );

  useEffect(() => {
    if (!hasLiveRuns && !startedRunId) {
      return;
    }

    const timer = window.setInterval(() => {
      void loadRuns({ quiet: true });
    }, 2500);

    return () => {
      window.clearInterval(timer);
    };
  }, [hasLiveRuns, loadRuns, startedRunId]);

  useEffect(() => {
    if (!startedRunId) return;
    const started = runs.find((run) => run.id === startedRunId);
    if (started && !liveRunStates.has(started.state)) {
      // Keep banner briefly after completion, then clear query noise.
      const timer = window.setTimeout(() => {
        setStartedRunId(null);
        const url = new URL(window.location.href);
        url.searchParams.delete("started");
        window.history.replaceState({}, "", `${url.pathname}${url.search}`);
      }, 4000);
      return () => window.clearTimeout(timer);
    }
  }, [runs, startedRunId]);

  useEffect(() => {
    if (!selectedRunJobId && jobs.length > 0) {
      setSelectedRunJobId(jobs[0].id);
    }
  }, [jobs, selectedRunJobId]);

  const jobsById = useMemo(() => {
    return jobs.reduce<Record<string, ContextJob>>((acc, job) => {
      acc[job.id] = job;
      return acc;
    }, {});
  }, [jobs]);

  const filteredRuns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return runs.filter((run) => {
      const job = jobsById[run.jobId] ?? run.job;
      const jobName = job?.name ?? "";
      const haystack = [
        run.id,
        run.jobId,
        run.state,
        run.outcome,
        run.userRequest,
        jobName,
        job?.workflowType,
        job?.executionProvider,
        job?.executionModel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = query.length === 0 || haystack.includes(query);
      const matchesState = stateFilter === "all" || run.state === stateFilter;
      return matchesQuery && matchesState;
    });
  }, [jobsById, runs, searchQuery, stateFilter]);

  const countsByState = useMemo(() => {
    return stateOptions.reduce<Record<RunStateFilter, number>>((acc, state) => {
      acc[state] = state === "all" ? runs.length : runs.filter((run) => run.state === state).length;
      return acc;
    }, { all: runs.length } as Record<RunStateFilter, number>);
  }, [runs]);

  const selectedRunJob = jobsById[selectedRunJobId] ?? jobs[0] ?? null;
  const hasAccess = entitlements.status === "succeeded" && entitlements.contextJobsEnabled;

  const handleStartRun = async (): Promise<void> => {
    if (!selectedRunJob) {
      setRunComposerError("Pick a job before starting a run.");
      return;
    }

    if (!runRequest.trim()) {
      setRunComposerError("Add a user request before starting a run.");
      return;
    }

    try {
      setIsStartingRun(true);
      setRunComposerError(null);
      const started: ContextJobRunStartResponse = await startContextJobRun(selectedRunJob.id, runRequest.trim());
      setStartedRunId(started.id);
      setIsRunComposerOpen(false);
      setRunRequest("");
      router.push(`/context-jobs/runs/${started.id}`);
    } catch (err) {
      setRunComposerError(err instanceof Error ? err.message : "Failed to start run");
    } finally {
      setIsStartingRun(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_42%),linear-gradient(180deg,_#f8fbff_0%,_#f5f7fb_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              Context Jobs
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Runs</h1>
            <p className="text-sm leading-6 text-slate-600 sm:text-base">
              Track execution history, inspect run states, and open the parent job when you want to adjust the config or launch a new attempt.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => setIsRunComposerOpen((current) => !current)}
              disabled={!jobs.length}
              className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              + New Run
            </button>
            <Link
              href="/context-jobs/jobs"
              className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 sm:w-auto"
            >
              Back to jobs
            </Link>
            <Link
              href="/context-jobs"
              className="inline-flex w-full items-center justify-center rounded-full border border-blue-200 bg-white px-5 py-3 text-sm font-medium text-blue-700 shadow-sm sm:w-auto"
            >
              Dashboard
            </Link>
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

        {startedRunId ? (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
            <p className="text-sm font-medium">
              Run started. Status updates live on this page — open the run when you want the full detail.
            </p>
            <p className="mt-1 break-all text-xs text-blue-800">Run id: {startedRunId}</p>
          </div>
        ) : null}

        {entitlements.status === "succeeded" && !entitlements.contextJobsEnabled ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Upgrade required</p>
            <h2 className="mt-3 text-2xl font-semibold text-amber-950">Context Jobs are not enabled for this account</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-900/80">
              Your current plan does not allow Context Jobs access. Upgrade to Pro to view the runs library here.
            </p>
          </div>
        ) : null}

        {isLoading || entitlements.status === "loading" ? (
          <div className="flex items-center justify-center rounded-3xl border border-white/70 bg-white/80 py-16 shadow-sm backdrop-blur">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
              <p className="mt-4 text-sm text-slate-600">Loading runs...</p>
            </div>
          </div>
        ) : hasAccess ? (
          <div className="space-y-6">
            {isRunComposerOpen ? (
              <section className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Run launcher</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">Start a new run</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Choose a job, add a user request, and launch the run straight from this page.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsRunComposerOpen(false)}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.2fr_auto]">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Job</span>
                    <select
                      value={selectedRunJobId}
                      onChange={(event) => setSelectedRunJobId(event.target.value)}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-slate-400"
                    >
                      {jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">User request</span>
                    <input
                      value={runRequest}
                      onChange={(event) => setRunRequest(event.target.value)}
                      placeholder="What should this run do?"
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400"
                    />
                  </label>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => void handleStartRun()}
                      disabled={isStartingRun || !selectedRunJob}
                      className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isStartingRun ? "Starting..." : "Start run"}
                    </button>
                  </div>
                </div>

                {runComposerError ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
                    <p className="text-sm font-medium">{runComposerError}</p>
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">Runs</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{runs.length}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Executed in this workspace</p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">Active</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{queueStatus?.active_runs ?? 0}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Currently running</p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">Queued</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{queueStatus?.queued_runs ?? 0}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Waiting for a worker</p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">Queue</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{queueStatus?.queue_capacity ?? 0}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Capacity, with {queueStatus?.workers ?? 0} workers</p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <label className="flex w-full max-w-md flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">State filter</span>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <select
                      value={stateFilter}
                      onChange={(event) => setStateFilter(event.target.value as RunStateFilter)}
                      className="w-full border-0 bg-transparent text-sm font-medium text-slate-900 outline-none"
                    >
                      {stateOptions.map((state) => (
                        <option key={state} value={state}>
                          {state === "all" ? `All states (${countsByState.all})` : `${getRunStateMeta(state).label} (${countsByState[state]})`}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <span className="text-sm font-medium text-slate-500">Search</span>
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Run id, job name, prompt, state..."
                    className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </label>
              </div>
            </section>

            {filteredRuns.length === 0 ? (
              <div className="rounded-3xl border border-white/70 bg-white/80 p-10 text-center shadow-sm backdrop-blur">
                <h2 className="text-lg font-semibold text-slate-900">No matching runs</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Try a different search term or switch the state filter to see another set of runs.
                </p>
                <Link
                  href="/context-jobs/jobs"
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  Launch a job
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredRuns.map((run) => {
                  const meta = getRunStateMeta(run.state);
                  const job = jobsById[run.jobId] ?? run.job;
                  const jobName = job?.name || `Job ${run.jobId.slice(0, 8)}`;
                  const isAnimated = ["planning", "retrieving", "executing", "validating"].includes(run.state);
                  const isStartedFocus = startedRunId === run.id;

                  return (
                    <article
                      key={run.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/context-jobs/runs/${run.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/context-jobs/runs/${run.id}`);
                        }
                      }}
                      className={
                        isStartedFocus
                          ? "cursor-pointer rounded-[2rem] border border-blue-300 bg-blue-50/70 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md backdrop-blur focus:outline-none focus:ring-2 focus:ring-blue-300"
                          : "cursor-pointer rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md backdrop-blur focus:outline-none focus:ring-2 focus:ring-slate-300"
                      }
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${meta.dotClass} ${isAnimated ? "animate-pulse" : ""}`} />
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
                            {run.outcome ? (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                {formatRunTitle(run)}
                              </span>
                            ) : null}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <p className="text-lg font-semibold text-slate-900">Run {run.id.slice(0, 8)}</p>
                            <p className="text-sm text-slate-600">
                              <Link
                                href={`/context-jobs/jobs/${run.jobId}`}
                                className="font-semibold text-blue-700 hover:text-blue-900"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {jobName}
                              </Link>
                            </p>
                          </div>

                          <p className="max-w-3xl text-sm leading-6 text-slate-600">
                            {run.userRequest || "No user request was captured for this run."}
                          </p>

                          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-slate-50 px-3 py-1">Started {formatDate(run.startedAt)}</span>
                            <span className="rounded-full bg-slate-50 px-3 py-1">
                              {run.endedAt ? `Ended ${formatDate(run.endedAt)}` : "Still in progress"}
                            </span>
                            <span className="rounded-full bg-slate-50 px-3 py-1">{formatTokens(run.tokenUsage)} tokens</span>
                            <span className="rounded-full bg-slate-50 px-3 py-1">{formatDuration(run.latencyMs)} latency</span>
                            {run.executionProvider ? <span className="rounded-full bg-slate-50 px-3 py-1">{run.executionProvider}</span> : null}
                            {run.executionModel ? <span className="rounded-full bg-slate-50 px-3 py-1">{run.executionModel}</span> : null}
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 lg:w-56">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Run id</p>
                            <p className="mt-1 break-all text-sm font-semibold text-slate-900">{run.id}</p>
                          </div>
                          <button
                            type="button"
                            className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(`/context-jobs/jobs/${run.jobId}`);
                            }}
                          >
                            Open job
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ContextJobsRunsPage() {
  return (
    <AuthGuard>
      <ContextJobsRunsContent />
    </AuthGuard>
  );
}
