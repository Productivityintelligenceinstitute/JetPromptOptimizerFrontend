"use client";

import Link from "next/link";
import AuthGuard from "@/shared/components/auth/AuthGuard";

function ContextJobsAssetsContent() {
  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-sm backdrop-blur">
          <p className="inline-flex rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
            Context Jobs
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Assets</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            This section is reserved for the Context Jobs asset library. We’ll wire the full experience here in a later slice.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/context-jobs/jobs"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Go to jobs
            </Link>
            <Link
              href="/context-jobs/runs"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
            >
              Go to runs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContextJobsAssetsPage() {
  return (
    <AuthGuard>
      <ContextJobsAssetsContent />
    </AuthGuard>
  );
}
