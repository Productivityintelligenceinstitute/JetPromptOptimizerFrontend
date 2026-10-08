"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/shared/components/auth/AuthGuard";
import UpgradeRequiredModal from "@/shared/components/Modal/UpgradeRequiredModal";
import {
  createContextJobFromPrompt,
  getContextJobsStats,
  type ContextJobsStats,
} from "@/shared/api/contextJobs";
import { useAuth } from "@/shared/context/AuthContext";
import { useContextJobsEntitlements } from "@/shared/hooks/useContextJobsEntitlements";
import { storeContextJobDraft } from "@/shared/lib/contextJobsDraft";
import { hasPermissionForLevel, type OptimizationLevel } from "@/shared/utils/optimizationLevel";

const promptCards: Array<{
  title: string;
  level: OptimizationLevel;
  tone: string;
  accent: string;
  summary: string;
}> = [
  {
    title: "Basic",
    level: "basic",
    tone: "from-sky-50 to-white",
    accent: "text-sky-700",
    summary: "Lightweight prompt cleanup for quick wins and shorter turnaround.",
  },
  {
    title: "Structured",
    level: "structured",
    tone: "from-teal-50 to-white",
    accent: "text-teal-700",
    summary: "Adds roles, expected output, and guardrails for steadier results.",
  },
  {
    title: "Mastery",
    level: "mastery",
    tone: "from-emerald-50 to-white",
    accent: "text-emerald-700",
    summary: "Uses stronger scaffolding for more demanding prompt workflows.",
  },
  {
    title: "System",
    level: "system",
    tone: "from-slate-50 to-white",
    accent: "text-slate-700",
    summary: "Keeps the highest-level rules and constraints ready for reuse.",
  },
];

const WORKFLOW_TYPES = [
  { value: "standard", label: "Standard" },
  { value: "research", label: "Research" },
  { value: "analysis", label: "Analysis" },
  { value: "generation", label: "Generation" },
  { value: "decision", label: "Decision-support" },
  { value: "extraction", label: "Extraction" },
  { value: "review", label: "Review" },
  { value: "monitoring", label: "Monitoring" },
  { value: "procurement", label: "Procurement" },
  { value: "contract_review", label: "Contract review" },
  { value: "supplier_assessment", label: "Supplier assessment" },
  { value: "sow_intelligence", label: "SOW intelligence" },
] as const;

function formatPercent(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0%";
  }

  const normalized = value > 1 ? value : value * 100;
  return `${normalized.toFixed(normalized >= 10 ? 0 : 1)}%`;
}

function ContextJobsDashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const entitlements = useContextJobsEntitlements();
  const [stats, setStats] = useState<ContextJobsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [workflowType, setWorkflowType] = useState<(typeof WORKFLOW_TYPES)[number]["value"]>("standard");
  const [isCreating, setIsCreating] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeatureName, setUpgradeFeatureName] = useState("");

  const handleOptimizationLevelClick = (level: OptimizationLevel, title: string): void => {
    const hasPermission = hasPermissionForLevel(user?.package_name, level, user?.role);
    if (!hasPermission) {
      setUpgradeFeatureName(title);
      setUpgradeModalOpen(true);
      return;
    }
    router.push(`/chat/new?level=${level}`);
  };

  useEffect(() => {
    let mounted = true;

    const loadStats = async (): Promise<void> => {
      if (entitlements.status === "failed") {
        if (mounted) {
          setError("Failed to load Context Jobs access information.");
          setIsLoading(false);
        }
        return;
      }

      if (entitlements.status !== "succeeded") {
        return;
      }

      if (!entitlements.contextJobsEnabled) {
        if (mounted) {
          setStats(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getContextJobsStats();
        if (mounted) {
          setStats(data);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load Context Jobs dashboard");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadStats();

    return () => {
      mounted = false;
    };
  }, [entitlements.contextJobsEnabled, entitlements.status]);

  const handleCreateFromPrompt = async (): Promise<void> => {
    if (!prompt.trim()) {
      setPromptError("Add a prompt before continuing.");
      return;
    }

    try {
      setIsCreating(true);
      setPromptError(null);
      const draft = await createContextJobFromPrompt({
        prompt: prompt.trim(),
      });
      storeContextJobDraft(
        {
          ...draft,
          workflowType,
        },
        {
          source: "prompt",
          sourceLabel: "Prompt generated",
        }
      );
      setPromptModalOpen(false);
      setPrompt("");
      setWorkflowType("standard");
      router.push("/context-jobs/jobs/new");
    } catch (err) {
      setPromptError(err instanceof Error ? err.message : "Failed to generate a job draft");
    } finally {
      setIsCreating(false);
    }
  };

  const hasAccess = entitlements.status === "succeeded" && entitlements.contextJobsEnabled;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_42%),linear-gradient(180deg,_#f8fbff_0%,_#f5f7fb_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              Context Jobs
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Build a Context Job
            </h1>
            <p className="text-sm leading-6 text-slate-600 sm:text-base">
              Start from the dashboard, review live usage, and move into the jobs library when you are ready to inspect or manage existing jobs.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/context-jobs/jobs"
              className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 sm:w-auto"
            >
              Open jobs library
            </Link>
            <Link
              href="/context-jobs/runs"
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
            >
              View runs
            </Link>
            <Link
              href="/context-jobs/templates"
              className="inline-flex w-full items-center justify-center rounded-full border border-blue-200 bg-white px-5 py-3 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 sm:w-auto"
            >
              Browse templates
            </Link>
            <button
              type="button"
              onClick={() => setPromptModalOpen(true)}
              className="inline-flex w-full items-center justify-center rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 sm:w-auto"
            >
              Create from prompt
            </button>
            <div className="inline-flex w-full items-center justify-center rounded-full border border-blue-200 bg-white px-5 py-3 text-sm font-medium text-blue-700 shadow-sm sm:w-auto">
              Live overview
            </div>
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
              Your current plan does not allow Context Jobs access yet. Upgrade to Pro to unlock the dashboard and job management views.
            </p>
            <Link
              href="/signup"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-amber-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-900"
            >
              Upgrade
            </Link>
          </div>
        ) : null}

        {isLoading || entitlements.status === "loading" ? (
          <div className="flex items-center justify-center rounded-3xl border border-white/70 bg-white/80 py-16 shadow-sm backdrop-blur">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
              <p className="mt-4 text-sm text-slate-600">Loading dashboard...</p>
            </div>
          </div>
        ) : hasAccess ? (
          <div className="space-y-8">
            <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">Dashboard</p>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                      Build a Context Job, review the live workspace, and keep moving.
                    </h2>
                    <p className="text-sm leading-6 text-slate-600">
                      A clear entry point with live stats and a fast path into the jobs library.
                    </p>
                  </div>

                  <div className="grid w-full gap-3 sm:min-w-64 lg:w-auto">
                    <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">Primary action</p>
                      <p className="mt-2 text-lg font-semibold">Open the jobs library</p>
                      <p className="mt-1 text-sm text-white/70">Inspect statuses, search jobs, and review the detail view.</p>
                    </div>
                    <Link
                      href="/context-jobs/jobs"
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                      Go to jobs
                    </Link>
                    <Link
                      href="/context-jobs/runs"
                      className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50"
                    >
                      Go to runs
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                {[
                  { label: "Jobs", value: stats?.jobCount ?? 0, note: "Created in this workspace", href: "/context-jobs/jobs" },
                  { label: "Runs", value: stats?.runCount ?? 0, note: "Captured in the dashboard", href: "/context-jobs/runs" },
                  { label: "Assets", value: stats?.assetCount ?? 0, note: "Referenced by jobs", href: "/context-jobs/assets" },
                  { label: "Pass rate", value: formatPercent(stats?.passRate ?? 0), note: "Across recent evaluations", href: "/context-jobs/runs" },
                ].map((tile) => (
                  <Link
                    key={tile.label}
                    href={tile.href}
                    className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur transition-colors hover:border-slate-300 hover:bg-white"
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">{tile.label}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{tile.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{tile.note}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Prompt optimization</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Four guided optimization levels</h3>
                </div>
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                  Prompt shaping across Fast, Intermediate, Advanced, and Expert
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {promptCards.map((card) => (
                  <button
                    key={card.title}
                    type="button"
                    onClick={() => handleOptimizationLevelClick(card.level, card.title)}
                    className={`rounded-3xl border border-slate-200 bg-gradient-to-br ${card.tone} p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200`}
                  >
                    <p className={`text-sm font-semibold uppercase tracking-[0.22em] ${card.accent}`}>{card.title}</p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">Optimization tier</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{card.summary}</p>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Start {card.title.toLowerCase()} chat
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Next steps</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">Open the jobs library or start a new Context Job</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Use the builder to create and publish jobs, then run them and review results from the runs workspace.
                </p>
              </div>
            </section>
          </div>
        ) : null}

        {promptModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">From prompt</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Generate a draft job</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Describe the job in plain language and we&apos;ll send the generated draft into the builder for review.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPromptModalOpen(false)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Prompt</span>
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Create a job that reviews vendor contracts for renewal risk and flags missing clauses."
                    className="min-h-40 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Workflow type</span>
                  <select
                    value={workflowType}
                    onChange={(event) => setWorkflowType(event.target.value as (typeof WORKFLOW_TYPES)[number]["value"])}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  >
                    {WORKFLOW_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                {promptError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
                    <p className="text-sm font-medium">{promptError}</p>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setPromptModalOpen(false)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateFromPrompt()}
                  disabled={isCreating}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating ? "Generating..." : "Generate draft"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <UpgradeRequiredModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          featureName={upgradeFeatureName}
        />
      </div>
    </div>
  );
}

export default function ContextJobsRootPage() {
  return (
    <AuthGuard>
      <ContextJobsDashboardContent />
    </AuthGuard>
  );
}
