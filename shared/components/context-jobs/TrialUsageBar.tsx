"use client";

import { useEffect, useState } from "react";
import { useContextJobsEntitlements } from "@/shared/hooks/useContextJobsEntitlements";
import { refreshContextJobsEntitlements } from "@/shared/lib/refreshContextJobsEntitlements";
import { cn } from "@/shared/lib/cn";

const clamp = (value: number): number => Math.min(Math.max(value, 0), 100);
const STORAGE_KEY = "context-jobs-trial-usage-collapsed";

export function TrialUsageBar() {
  const entitlements = useContextJobsEntitlements();
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "0") setCollapsed(false);
      if (stored === "1") setCollapsed(true);
    } catch {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    void refreshContextJobsEntitlements();
  }, []);

  if (!entitlements.limits || !entitlements.usage) {
    return null;
  }

  const maxJobs = entitlements.limits.maxJobs ?? 0;
  const maxRuns = entitlements.limits.maxRuns ?? 0;
  const jobsUsed = entitlements.usage.jobs ?? 0;
  const runsUsed = entitlements.usage.runs ?? 0;
  const jobPercent = maxJobs > 0 ? clamp((jobsUsed / maxJobs) * 100) : 0;
  const runPercent = maxRuns > 0 ? clamp((runsUsed / maxRuns) * 100) : 0;
  const nearLimit = (maxJobs > 0 && jobsUsed >= maxJobs) || (maxRuns > 0 && runsUsed >= maxRuns);

  const toggleCollapsed = (): void => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore storage failures
      }
      return next;
    });
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={toggleCollapsed}
        className={cn(
          "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-left shadow-sm transition-colors",
          nearLimit
            ? "border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        )}
        title="Expand trial usage"
      >
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          {entitlements.plan || "trial"}
        </span>
        <span className="truncate text-xs font-medium">
          Jobs {jobsUsed}/{maxJobs} · Runs {runsUsed}/{maxRuns}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Expand</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-white shadow-sm",
        nearLimit ? "border-amber-200" : "border-slate-200",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-slate-900">Trial usage</p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
              {entitlements.plan || "trial"}
            </span>
          </div>
          <p className="text-[11px] leading-4 text-slate-500">Lifetime jobs & runs allowance</p>
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 transition-colors hover:bg-slate-100"
        >
          Collapse
        </button>
      </div>

      <div className="grid gap-2 border-t border-slate-100 px-3 py-2 sm:grid-cols-2">
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-600">
            <span>Jobs</span>
            <span>
              {jobsUsed} / {maxJobs}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${jobPercent}%` }} />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-600">
            <span>Runs</span>
            <span>
              {runsUsed} / {maxRuns}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${runPercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
