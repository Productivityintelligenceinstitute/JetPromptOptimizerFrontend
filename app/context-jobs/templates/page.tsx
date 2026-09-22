"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/shared/components/auth/AuthGuard";
import {
  getContextJobsTemplates,
  instantiateContextJobTemplate,
  setupProcurementDemo,
  type ContextJob,
} from "@/shared/api/contextJobs";
import { useContextJobsEntitlements } from "@/shared/hooks/useContextJobsEntitlements";
import { storeContextJobDraft } from "@/shared/lib/contextJobsDraft";
import {
  LIFECYCLE_OVERVIEW,
  PERSONA_META,
  displayTemplateDescription,
  groupTemplatesByFamily,
  type TemplatePersona,
} from "@/shared/lib/procurementTemplateCatalog";

const PERSONA_ORDER: TemplatePersona[] = ["full", "executive", "scorecard"];

function TemplateGalleryContent() {
  const router = useRouter();
  const entitlements = useContextJobsEntitlements();
  const [templates, setTemplates] = useState<ContextJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [launchingKey, setLaunchingKey] = useState<string | null>(null);
  const [personaByFamily, setPersonaByFamily] = useState<Record<string, TemplatePersona>>({});

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

  const families = useMemo(() => groupTemplatesByFamily(templates), [templates]);

  const selectedPersona = (familyId: string, variants: Partial<Record<TemplatePersona, ContextJob>>): TemplatePersona => {
    const preferred = personaByFamily[familyId];
    if (preferred && variants[preferred]) return preferred;
    for (const persona of PERSONA_ORDER) {
      if (variants[persona]) return persona;
    }
    return "full";
  };

  const handleUseTemplate = async (template: ContextJob): Promise<void> => {
    try {
      setLaunchingKey(`use:${template.id}`);
      setError(null);
      const draft = await instantiateContextJobTemplate(template.id);
      const { chainConfig: _removed, ...withoutChain } = draft;
      storeContextJobDraft(
        {
          ...withoutChain,
          status: "draft",
        },
        {
          source: "template",
          sourceId: template.id,
          sourceLabel: template.name,
        },
      );
      router.push("/context-jobs/jobs/new");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to instantiate template");
    } finally {
      setLaunchingKey(null);
    }
  };

  const handleDemoSetup = async (template: ContextJob): Promise<void> => {
    try {
      setLaunchingKey(`demo:${template.id}`);
      setError(null);
      const result = await setupProcurementDemo({
        templateId: template.id,
      });
      if (result.ingestion.error || result.ingestion.status === "failed") {
        setError(
          result.ingestion.error ||
            "Demo KB ingestion reported a failure. Job was created — open it to retry ingest.",
        );
      }
      router.push(`/context-jobs/jobs/${result.job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set up demo with template");
    } finally {
      setLaunchingKey(null);
    }
  };

  const hasAccess = entitlements.status === "succeeded" && entitlements.contextJobsEnabled;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_42%),linear-gradient(180deg,_#f8fbff_0%,_#f5f7fb_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="inline-flex rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              Templates
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Procurement Intelligence
            </h1>
            <p className="text-sm leading-6 text-slate-600 sm:text-base">
              Four governed procurement workflows — each with Full, Executive, and Scorecard output
              personas. Pick a family, choose an audience, then instantiate into the builder or seed
              the demo knowledge base for a guided pilot.
            </p>
            <p className="text-sm text-slate-500">
              Lifecycle: Contract Review → Capability Matrix → Onboarding.{" "}
              <Link
                href="/context-jobs/procurement/alerts"
                className="font-medium text-blue-700 underline-offset-2 hover:underline"
              >
                Renewal alerts
              </Link>
            </p>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">{LIFECYCLE_OVERVIEW}</p>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Runs retrieve evidence from the job&apos;s knowledge base (Jet managed or your external
              vector connection). One KB can hold many contracts, policies, rate cards, and vendor
              profiles across jobs — so when you ingest, stamp identifying metadata (for example{" "}
              <span className="font-medium text-slate-800">contractId</span>,{" "}
              <span className="font-medium text-slate-800">vendor</span>, or{" "}
              <span className="font-medium text-slate-800">file</span>). Then scope a job with{" "}
              <span className="font-medium text-slate-800">Trusted sources</span> using the same
              metadata key and value so retrieval stays on the right documents.
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
          families.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {families.map(({ family, variants }) => {
                const persona = selectedPersona(family.id, variants);
                const selected = variants[persona];
                const availablePersonas = PERSONA_ORDER.filter((p) => Boolean(variants[p]));
                const showLifecycleGuide = persona === "full" && Boolean(family.lifecycleGuide);
                const guide = family.lifecycleGuide;
                const useBusy = launchingKey === `use:${selected?.id ?? ""}`;
                const demoBusy = launchingKey === `demo:${selected?.id ?? ""}`;

                return (
                  <article
                    key={family.id}
                    className="flex h-full flex-col rounded-[2rem] border border-white/70 bg-white/95 p-6 shadow-sm backdrop-blur sm:p-8"
                  >
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                        System family
                      </p>
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{family.title}</h2>
                      <p className="text-sm leading-6 text-slate-600">{family.summary}</p>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Problem</p>
                        <p className="mt-1 text-sm leading-6 text-slate-800">{family.problem}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Outcome</p>
                        <p className="mt-1 text-sm leading-6 text-slate-800">{family.outcome}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Needs</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {family.inputsNeeded.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                      {family.inputSetupNote ? (
                        <p className="mt-3 text-sm leading-6 text-slate-600">{family.inputSetupNote}</p>
                      ) : null}
                    </div>

                    <div className="mt-6">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Output persona</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {availablePersonas.map((p) => {
                          const meta = PERSONA_META[p];
                          const active = p === persona;
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() =>
                                setPersonaByFamily((prev) => ({
                                  ...prev,
                                  [family.id]: p,
                                }))
                              }
                              className={`rounded-full px-4 py-2 text-left text-sm transition-colors ${
                                active
                                  ? "bg-slate-900 text-white"
                                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                              }`}
                            >
                              <span className="block font-semibold">{meta.label}</span>
                              <span className={`block text-xs ${active ? "text-slate-300" : "text-slate-500"}`}>
                                {meta.forWhom}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{PERSONA_META[persona].hint}</p>
                    </div>

                    {selected ? (
                      <p className="mt-4 text-sm leading-6 text-slate-600">
                        {displayTemplateDescription(selected.description, selected.goal)}
                      </p>
                    ) : (
                      <p className="mt-4 text-sm text-amber-800">This persona is not available in the template set yet.</p>
                    )}

                    {showLifecycleGuide && guide ? (
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">
                          Lifecycle next: {guide.nextJobName}
                        </p>
                        <p className="mt-2 leading-6 text-slate-600">
                          After this job finishes, continue the lifecycle manually — no automatic handoff.
                          Put only the useful pieces from this result into the next job&apos;s User request,
                          then add that job&apos;s Needs in the request or knowledge base and run it.
                        </p>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Carry into next User request
                        </p>
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700">
                          {guide.carryFromResult.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Next job needs
                        </p>
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700">
                          {guide.nextNeeds.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : family.lifecycleGuide ? (
                      <p className="mt-5 text-sm text-slate-500">
                        Lifecycle next-step guidance is shown on the{" "}
                        <span className="font-semibold text-slate-800">Full / Analyst</span> persona
                        (→ {family.lifecycleGuide.nextJobName}).
                      </p>
                    ) : null}

                    <p className="mt-4 text-xs leading-5 text-slate-500">{family.demoHint}</p>

                    <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row">
                      <button
                        type="button"
                        disabled={!selected || Boolean(launchingKey)}
                        onClick={() => selected && void handleUseTemplate(selected)}
                        className="inline-flex flex-1 items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {useBusy ? "Preparing..." : "Use template"}
                      </button>
                      <button
                        type="button"
                        disabled={!selected || Boolean(launchingKey)}
                        onClick={() => selected && void handleDemoSetup(selected)}
                        className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {demoBusy ? "Seeding demo KB..." : "Use with demo KB"}
                      </button>
                    </div>
                  </article>
                );
              })}
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
