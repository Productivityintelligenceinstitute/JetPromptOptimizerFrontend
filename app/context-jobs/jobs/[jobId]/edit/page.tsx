"use client";

import { useParams } from "next/navigation";
import ContextJobBuilder from "@/shared/components/context-jobs/ContextJobBuilder";

function normalizeJobId(jobIdParam: string | string[] | undefined): string | null {
  if (typeof jobIdParam === "string" && jobIdParam.trim()) {
    return jobIdParam;
  }

  if (Array.isArray(jobIdParam) && typeof jobIdParam[0] === "string" && jobIdParam[0].trim()) {
    return jobIdParam[0];
  }

  return null;
}

export default function EditContextJobPage() {
  const params = useParams<{ jobId?: string | string[] }>();
  const jobId = normalizeJobId(params?.jobId);

  if (!jobId) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_42%),linear-gradient(180deg,_#f8fbff_0%,_#f5f7fb_100%)]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <h1 className="text-2xl font-semibold text-amber-950">Missing job id</h1>
            <p className="mt-2 text-sm leading-6 text-amber-900/80">
              The editor could not read the job id from the route.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <ContextJobBuilder mode="edit" jobId={jobId} />;
}
