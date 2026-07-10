"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/shared/components/auth/AuthGuard";
import {
  getContextJobsTemplates,
  instantiateContextJobTemplate,
  type ContextJob,
} from "@/shared/api/contextJobs";
import { useContextJobsEntitlements } from "@/shared/hooks/useContextJobsEntitlements";
import { storeContextJobDraft } from "@/shared/lib/contextJobsDraft";

function formatMaybeDate(value: string | null | undefined): string {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function TemplateGalleryContent() {
  const router = useRouter();
  const entitlements = useContextJobsEntitlements();
  const [templates, setTemplates] = useState<ContextJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [launchingTemplateId, setLaunchingTemplateId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadTemplates = async (): Promise<void> => {
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
          setTemplates([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getContextJobsTemplates();
        if (mounted) {
          setTemplates(data);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load templates");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadTemplates();

    return () => {
      mounted = false;
    };
  }, [entitlements.contextJobsEnabled, entitlements.status]);

  const handleUseTemplate = async (template: ContextJob): Promise<void> => {
    try {
      setLaunchingTemplateId(template.id);
      setError(null);
      const draft = await instantiateContextJobTemplate(template.id);
      storeContextJobDraft(draft, {
        source: "template",
        sourceId: template.id,
        sourceLabel: template.name,
      });
      router.push("/context-jobs/jobs/new");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to instantiate template");
    } finally {
      setLaunchingTemplateId(null);
    }
  };

  const hasAccess = entitlements.status === "succeeded" && entitlements.contextJobsEnabled;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_42%),linear-gradient(180deg,_#f8fbff_0%,_#f5f7fb_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              Templates
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Template gallery
            </h1>
            <p className="text-sm leading-6 text-slate-600 sm:text-base">
              Pick a starting point, instantiate it into your workspace, and continue editing in the job builder.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/context-jobs/jobs"
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
            >
              Open jobs library
            </Link>
            <Link
              href="/context-jobs"
              className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 sm:w-auto"
            >
              Back to dashboard
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : null}

        {entitlements.status === "succeeded" && !entitlements.contextJobsEnabled ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Upgrade required</p>
            <h2 className="mt-3 text-2xl font-semibold text-amber-950">Templates are not enabled for this account</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-900/80">
              Upgrade to Pro to browse the template gallery and instantiate a prebuilt job into the builder.
            </p>
          </div>
        ) : null}

        {isLoading || entitlements.status === "loading" ? (
          <div className="flex items-center justify-center rounded-3xl border border-white/70 bg-white/80 py-16 shadow-sm backdrop-blur">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
              <p className="mt-4 text-sm text-slate-600">Loading templates...</p>
            </div>
          </div>
        ) : hasAccess ? (
          templates.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {templates.map((template) => (
                <article
                  key={template.id}
                  className="flex h-full flex-col rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">System template</p>
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{template.name}</h2>
                      <p className="text-sm leading-6 text-slate-600">
                        {template.description || template.goal || "No template description is available yet."}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {template.status}
                    </span>
                  </div>

                  <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Workflow</dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900">{template.workflowType}</dd>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Provider</dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900">{template.executionProvider}</dd>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Model</dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900">{template.executionModel}</dd>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Updated</dt>
                      <dd className="mt-1 text-sm font-semibold text-slate-900">{formatMaybeDate(template.updatedAt)}</dd>
                    </div>
                  </dl>

                  <div className="mt-auto flex flex-col gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() => void handleUseTemplate(template)}
                      disabled={launchingTemplateId === template.id}
                      className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {launchingTemplateId === template.id ? "Preparing..." : "Use template"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/70 bg-white/90 p-8 shadow-sm backdrop-blur">
              <h2 className="text-2xl font-semibold text-slate-900">No templates returned</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                The templates endpoint did not return any system templates for this workspace yet.
              </p>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}

export default function ContextJobsTemplatesPage() {
  return (
    <AuthGuard>
      <TemplateGalleryContent />
    </AuthGuard>
  );
}
