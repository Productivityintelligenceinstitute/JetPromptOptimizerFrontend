"use client";

import Link from "next/link";
import React from "react";
import { useContextJobsEntitlements } from "@/shared/hooks/useContextJobsEntitlements";
import { cn } from "@/shared/lib/cn";

type GateMode = "job" | "run";

interface ContextJobsAccessGateProps {
  mode: GateMode;
  children: React.ReactNode;
  blockedTitle?: string;
  blockedDescription?: string;
  className?: string;
}

const defaultCopy: Record<GateMode, { title: string; description: string }> = {
  job: {
    title: "Create job is locked",
    description: "Upgrade to Pro to create more Context Jobs.",
  },
  run: {
    title: "Run is locked",
    description: "Upgrade to Pro to launch additional Context Job runs.",
  },
};

export function ContextJobsAccessGate({
  mode,
  children,
  blockedTitle,
  blockedDescription,
  className,
}: ContextJobsAccessGateProps) {
  const entitlements = useContextJobsEntitlements();
  const allowed = mode === "job" ? entitlements.canCreateJob : entitlements.canCreateRun;

  if (allowed) {
    return <>{children}</>;
  }

  const copy = defaultCopy[mode];

  return (
    <div className={cn("rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-semibold">{blockedTitle || copy.title}</p>
          <p className="text-sm text-amber-900/80">{blockedDescription || copy.description}</p>
        </div>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-full bg-amber-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-900"
        >
          Upgrade
        </Link>
      </div>
    </div>
  );
}
