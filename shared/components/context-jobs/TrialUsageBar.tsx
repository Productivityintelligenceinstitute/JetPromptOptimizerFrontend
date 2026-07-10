"use client";

import { useContextJobsEntitlements } from "@/shared/hooks/useContextJobsEntitlements";

const clamp = (value: number): number => Math.min(Math.max(value, 0), 100);

export function TrialUsageBar() {
  const entitlements = useContextJobsEntitlements();

  if (!entitlements.limits || !entitlements.usage) {
    return null;
  }

  const jobPercent = entitlements.limits.maxJobs > 0
    ? clamp((entitlements.usage.jobs / entitlements.limits.maxJobs) * 100)
    : 0;
  const runPercent = entitlements.limits.maxRuns > 0
    ? clamp((entitlements.usage.runs / entitlements.limits.maxRuns) * 100)
    : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Trial usage</p>
          <p className="text-xs text-slate-500">Track your lifetime Context Jobs allowance.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
          {entitlements.plan || "trial"}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Jobs used</span>
            <span>{entitlements.usage.jobs} / {entitlements.limits.maxJobs}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${jobPercent}%` }} />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Runs used</span>
            <span>{entitlements.usage.runs} / {entitlements.limits.maxRuns}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${runPercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
