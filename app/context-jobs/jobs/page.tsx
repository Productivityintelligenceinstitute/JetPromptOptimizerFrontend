"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AuthGuard from "@/shared/components/auth/AuthGuard";
import {
  archiveContextJob,
  duplicateContextJob,
  getContextJobs,
  publishContextJob,
  type ContextJob,
} from "@/shared/api/contextJobs";
import { useContextJobsEntitlements } from "@/shared/hooks/useContextJobsEntitlements";

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  published: "bg-emerald-100 text-emerald-700",
  archived: "bg-gray-100 text-gray-600",
};

const filterOptions = ["all", "draft", "published", "archived"] as const;
type JobFilter = (typeof filterOptions)[number];

function formatUpdated(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || "Not set";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ContextJobsListContent() {
  const entitlements = useContextJobsEntitlements();
  const [jobs, setJobs] = useState<ContextJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobFilter>("all");
  const [openMenuJobId, setOpenMenuJobId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadJobs = async (): Promise<void> => {
      if (entitlements.status === "failed") {
        setJobs([]);
        setError("Failed to load Context Jobs access information.");
        setIsLoading(false);
        return;
      }

      if (entitlements.status !== "succeeded") {
        return;
      }

      if (!entitlements.contextJobsEnabled) {
        setJobs([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getContextJobs();
        if (mounted) {
          setJobs(data);
        }
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : "Failed to load Context Jobs";
        setError(message);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadJobs();

    return () => {
      mounted = false;
    };
  }, [entitlements.contextJobsEnabled, entitlements.status]);

  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      const haystack = [
        job.name,
        job.description,
        job.goal,
        job.workflowType,
        job.executionProvider,
        job.executionModel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = query.length === 0 || haystack.includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [jobs, searchQuery, statusFilter]);

  const countsByStatus = useMemo(() => {
    return filterOptions.reduce<Record<JobFilter, number>>((acc, status) => {
      acc[status] = status === "all" ? jobs.length : jobs.filter((job) => job.status === status).length;
      return acc;
    }, { all: jobs.length, draft: 0, published: 0, archived: 0 });
  }, [jobs]);

  const handleDuplicate = async (jobId: string): Promise<void> => {
    try {
      const duplicated = await duplicateContextJob(jobId);
      setJobs((current) => [duplicated, ...current]);
      setOpenMenuJobId(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate job");
    }
  };

  const handleArchive = async (jobId: string): Promise<void> => {
    const shouldArchive = window.confirm("Archive this job? You can bring it back later from the API.");
    if (!shouldArchive) return;

    try {
      const updated = await archiveContextJob(jobId);
      setJobs((current) => current.map((job) => (job.id === updated.id ? updated : job)));
      setOpenMenuJobId(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive job");
    }
  };

  const handlePublish = async (jobId: string): Promise<void> => {
    try {
      const updated = await publishContextJob(jobId);
      setJobs((current) => current.map((job) => (job.id === updated.id ? updated : job)));
      setOpenMenuJobId(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish job");
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
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Jobs library
            </h1>
            <p className="text-sm leading-6 text-slate-600 sm:text-base">
              Search existing jobs, switch between lifecycle states, and open the detail page for a fuller configuration view.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm shadow-sm backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Plan</p>
              <p className="mt-1 font-semibold text-slate-900">{entitlements.plan || "unknown"}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm shadow-sm backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Jobs</p>
              <p className="mt-1 font-semibold text-slate-900">{jobs.length}</p>
            </div>
            <Link
              href="/context-jobs/jobs/new"
              className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 sm:w-auto"
            >
              + New Context Job
            </Link>
            <Link
              href="/context-jobs/runs"
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
            >
              View runs
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {entitlements.status === "succeeded" && !entitlements.contextJobsEnabled ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Upgrade required</p>
            <h2 className="mt-3 text-2xl font-semibold text-amber-950">Context Jobs are not enabled for this account</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-900/80">
              Your current plan does not allow Context Jobs access. Upgrade to Pro to view and manage jobs here.
            </p>
            <Link
              href="/signup"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-amber-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-900"
            >
              Upgrade
            </Link>
          </div>
        ) : null}

        {entitlements.status === "loading" || isLoading ? (
          <div className="flex items-center justify-center rounded-3xl border border-white/70 bg-white/80 py-16 shadow-sm backdrop-blur">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
              <p className="mt-4 text-sm text-slate-600">Loading jobs...</p>
            </div>
          </div>
        ) : entitlements.contextJobsEnabled ? (
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {filterOptions.map((filter) => {
                    const active = statusFilter === filter;
                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setStatusFilter(filter)}
                        className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                          active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xs font-medium uppercase tracking-[0.2em] opacity-70">
                          {filter === "all" ? "All" : filter}
                        </span>
                        <span className="mt-2 block text-2xl font-semibold">{countsByStatus[filter]}</span>
                      </button>
                    );
                  })}
                </div>

                <label className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <span className="text-sm font-medium text-slate-500">Search</span>
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Name, goal, model, provider..."
                    className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </label>
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Showing <span className="font-semibold text-slate-900">{filteredJobs.length}</span> of{" "}
                <span className="font-semibold text-slate-900">{jobs.length}</span> jobs
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="text-sm font-medium text-blue-700 hover:text-blue-900"
              >
                Clear filters
              </button>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="rounded-3xl border border-white/70 bg-white/80 p-10 text-center shadow-sm backdrop-blur">
                <h2 className="text-lg font-semibold text-slate-900">No matching jobs</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Try a different search term or switch the status filter to see another set of jobs.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {filteredJobs.map((job) => (
                  <article
                    key={job.id}
                    className="group rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md backdrop-blur"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/context-jobs/jobs/${job.id}`} className="min-w-0 text-xl font-semibold text-slate-900 group-hover:text-blue-700">
                            {job.name}
                          </Link>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                              statusStyles[job.status] || "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {job.status}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            v{job.version}
                          </span>
                        </div>
                        <p className="max-w-md text-sm leading-6 text-slate-600">
                          {job.goal || job.description || "No goal or description has been set yet."}
                        </p>
                      </div>

                      <div className="relative self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setOpenMenuJobId((current) => (current === job.id ? null : job.id))}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-900"
                          aria-expanded={openMenuJobId === job.id}
                          aria-label={`Open actions for ${job.name}`}
                        >
                          More
                        </button>

                        {openMenuJobId === job.id ? (
                          <div className="absolute right-0 top-12 z-10 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                            <Link
                              href={`/context-jobs/jobs/${job.id}`}
                              className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                              onClick={() => setOpenMenuJobId(null)}
                            >
                              Open
                            </Link>
                            <button
                              type="button"
                              onClick={() => void handleDuplicate(job.id)}
                              className="block w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Duplicate
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleArchive(job.id)}
                              className="block w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Archive
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (job.status === "published") return;
                                void handlePublish(job.id);
                              }}
                              disabled={job.status === "published"}
                              className={`block w-full px-4 py-3 text-left text-sm font-medium ${
                                job.status === "published"
                                  ? "cursor-not-allowed text-slate-400"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                              title={
                                job.status === "published"
                                  ? "This job is already published"
                                  : "Publish this job now"
                              }
                            >
                              Publish
                            </button>
                            <Link
                              href={`/context-jobs/jobs/${job.id}/edit`}
                              className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                              onClick={() => setOpenMenuJobId(null)}
                            >
                              Edit
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3">
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 text-sm">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Workflow</p>
                          <p className="mt-1 font-semibold text-slate-900">{job.workflowType}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Provider</p>
                          <p className="mt-1 font-semibold text-slate-900">{job.executionProvider}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Model</p>
                          <p className="mt-1 font-semibold text-slate-900">{job.executionModel}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Updated</p>
                          <p className="mt-1 font-semibold text-slate-900">{formatUpdated(job.updatedAt)}</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Summary</p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {job.goal || job.description || "This job is ready for deeper configuration review."}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {(job.assetIds ?? []).slice(0, 3).map((assetId) => (
                            <span key={assetId} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              Asset {assetId}
                            </span>
                          ))}
                          {(job.assetIds ?? []).length > 3 ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              +{(job.assetIds ?? []).length - 3} more
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ContextJobsListPage() {
  return (
    <AuthGuard>
      <ContextJobsListContent />
    </AuthGuard>
  );
}
