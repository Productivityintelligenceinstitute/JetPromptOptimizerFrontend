"use client";

import Link from "next/link";
import AuthGuard from "@/shared/components/auth/AuthGuard";

const sections = [
  {
    title: "What Context Jobs are",
    body: "A Context Job is a reusable AI workflow with fixed instructions, retrieval settings, tools, validation rules, and optional memory. Templates are expert-prefilled job configs — you still supply your documents, policies, and keys.",
  },
  {
    title: "Recommended first path",
    body: "1) Add a BYOK LLM key under Keys. 2) Connect a Vector DB (or use platform defaults if available). 3) Open Templates and instantiate a procurement template. 4) Ingest your contract/policy corpus. 5) Run the job and review the Run Output Package.",
  },
  {
    title: "Templates vs blank jobs",
    body: "Templates open the same 9-step builder with procurement defaults (tools, validators, glossary). Blank jobs start empty. Instantiating a template creates a draft config you save as your own job — it does not mutate the system template.",
  },
  {
    title: "Assets library",
    body: "Assets are shared building blocks: policies, glossaries, validation contracts, tool profiles, source profiles, and relationship patterns. Import them into any job from the builder so teams stay consistent without copy-paste.",
  },
  {
    title: "Procurement alerts",
    body: "The monitor watches ingested contracts for expiry windows by complexity tier. Open Alerts to dismiss noise or jump to a suggested renewal job. Lead times follow low/medium/high complexity defaults from your policy pack.",
  },
  {
    title: "Runs, HITL, and chains",
    body: "Each execution produces a run with tokens, latency, validation summary, and optional human-in-the-loop pauses for tool or memory approval. Chained jobs show parent/child runs on the run detail page. Artifacts (exports, generated files) are downloadable there.",
  },
  {
    title: "Optimized prompt → Context Job",
    body: "From Chat or the Prompt Library, use Convert to Context Job on an assistant response. Jet extracts the optimized prompt, generates a draft job config, and opens the builder so you can review before saving.",
  },
  {
    title: "BYOK and Vector DB",
    body: "Pro plans use your own LLM keys. Tool keys unlock external providers. Vector connections point retrieval at Pinecone, Qdrant, Weaviate, or pgvector. Test connections before ingesting large corpora.",
  },
  {
    title: "CLM import (Coupa / Ironclad)",
    body: "Save Coupa OAuth or Ironclad API credentials under CLM. On a job page, paste a Coupa /contracts/show/{id} or Ironclad /workflow/{id} or /record/{id} URL. Jet downloads the legal agreement, extracts text, and ingests it into that job's knowledge target — same as upload, without leaving the CLM.",
  },
  {
    title: "Trial limits",
    body: "Trial usage for jobs and runs appears in the Context Jobs header. When you hit a limit, upgrade or archive unused jobs. Replay and repair still count toward run usage where entitlements enforce it.",
  },
];

const quickLinks = [
  { href: "/context-jobs/templates", label: "Templates" },
  { href: "/context-jobs/jobs/new", label: "New job" },
  { href: "/context-jobs/assets", label: "Assets" },
  { href: "/context-jobs/procurement/alerts", label: "Alerts" },
  { href: "/context-jobs/keys", label: "Keys" },
  { href: "/context-jobs/vector-connections", label: "Vector DB" },
  { href: "/context-jobs/clm-connections", label: "CLM" },
  { href: "/context-jobs/runs", label: "Runs" },
];

function ContextJobsUserGuideContent() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_42%),linear-gradient(180deg,_#f7fcfc_0%,_#f4f8f8_100%)] px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
          <p className="inline-flex rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
            Context Jobs
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">User Guide</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            How to configure, run, and govern Context Jobs — including the procurement pack (templates, assets, expiry alerts, and chained renewals).
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          {sections.map((section, index) => (
            <article
              key={section.title}
              className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Step {index + 1}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{section.body}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

export default function ContextJobsUserGuidePage() {
  return (
    <AuthGuard>
      <ContextJobsUserGuideContent />
    </AuthGuard>
  );
}
