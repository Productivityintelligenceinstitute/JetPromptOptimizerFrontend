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

const walkthroughs = [
  {
    number: "1",
    title: "Contract Review & Renewal",
    goal: "Assess an MSA against policy, get a renew / renegotiate / exit decision, numbered recommendations, and the intent behind each edit.",
    steps: [
      "Open Templates. Stay on Full / Analyst.",
      "On Contract Review & Renewal, click Use with demo KB. That creates a job and seeds the sample MSA + policy.",
      "On the job page, paste the request below into User request and click Run now.",
      "On the run page, wait until the run completes. Confirm Decision, clause evidence, numbered recommendations, then Intent Behind the Edits (why Buyer wants the change and a talking point for Seller).",
      "If you Approve recommendations, the amendment run should apply only those edits. Optional: copy the decision and top gaps into the Capability Matrix request next.",
    ],
    request: `Review Acme Cloud Services MSA (contractId ACME-MSA-2024-001) against Jet Industries procurement policy.

Vendor: Acme Cloud Services Inc.
Category: Cloud Infrastructure
Expiry: 2026-12-31
Annual spend context: ~$1.2M (strategic cloud platform)

Produce a Full / Analyst renewal assessment:
- Decision: renew / renegotiate / exit
- Policy gaps and mandatory-clause misses with clause evidence
- Auto-renewal / notice-window risk
- AI / data-use and liability risks
- Numbered amendment-ready recommendations Legal can approve item-by-item
- After recommendations, Intent Behind the Edits so Buyer and Seller can discuss each change

If renegotiate or exit is recommended, call out which supplier alternatives we should evaluate next.`,
    expect:
      "Typical demo outcome is Renegotiate (notice window, liability cap, AI/data-use). After the numbered recs you should see Intent Behind the Edits — not just new clause wording. Carry the decision and top gaps into step 2.",
  },
  {
    number: "2",
    title: "Supplier Capability Matrix",
    goal: "Compare NexGen vs CloudCo on evidence, not marketing, and pick a shortlist winner.",
    steps: [
      "Open Templates → Supplier Capability Matrix → Full / Analyst → Use with demo KB.",
      "Paste the request below. Swap the RENEGOTIATE line if your Contract Review decision was different.",
      "Run now. Confirm a comparison matrix, me-too flags, evidence gaps, and a shortlist recommendation.",
      "Copy the recommended supplier name, risk tier, and open gaps into the Onboarding request.",
    ],
    request: `Following Contract Review of Acme Cloud Services MSA (ACME-MSA-2024-001):
recommended action was RENEGOTIATE before the 2026-12-31 renewal because of auto-renewal notice risk and policy-gap clauses.

Build a Supplier Capability Matrix for category: Cloud Infrastructure / Analytics & Platform services.

Suppliers to compare (exactly these two):
1) NexGen Analytics Ltd. (VND-NEXGEN-042) — medium risk, spend tier 2, strong analytics/ML/data-platform evidence.
2) CloudCo Systems AG (VND-CLOUDCO-017) — low risk, spend tier 1, strong cloud security / FinOps / EU residency; currently draft/RFP stage.

Evaluation focus:
- Differentiated capability evidence (not me-too feature lists)
- Risk tier and operational readiness
- Recommendation scenarios: keep-and-renegotiate Acme, dual-source, or shortlist a challenger

Ground only in Retrieved Context / vendor profiles. Do not invent evidence.
End with a clear shortlist recommendation and why.`,
    expect:
      "NexGen usually scores higher on analytics/ML; CloudCo on security/FinOps and lower risk. Pick one winner for onboarding (CloudCo is the cleaner low-risk demo path).",
  },
  {
    number: "3",
    title: "Supplier Onboarding Checklist",
    goal: "Turn the shortlist winner into a go / no-go package with owners, required docs, and open items.",
    steps: [
      "Open Templates → Supplier Onboarding Checklist → Full / Analyst → Use with demo KB.",
      "Paste the request below. If Capability Matrix preferred NexGen, swap the supplier block.",
      "Run now. Confirm owner-by-owner actions, required attestations, open risks, and an explicit go / conditional-go / no-go.",
    ],
    request: `Proceed to onboarding package for the Capability Matrix shortlist winner:

Recommended supplier: CloudCo Systems AG (VND-CLOUDCO-017)
Category: Cloud Security / FinOps advisory
Risk tier: low | Spend tier: 1
Context: Challenger / dual-source option while we renegotiate Acme Cloud Services MSA (ACME-MSA-2024-001) ahead of 2026-12-31. CloudCo is draft/RFP stage — no linked MSA yet.

Internal approval owners:
- Legal: Priya Shah
- Security: Marcus Lee
- Finance: Ana Ruiz
- Procurement lead: Jordan Blake

Produce a Full / Analyst onboarding checklist and go/no-go package:
- Required docs / attestations (security, insurance, DPA, SOC2/ISO if available)
- Owner-by-owner actions and sequencing
- Open risks / evidence gaps from the capability review
- Clear go / conditional-go / no-go recommendation for kicking off commercial paperwork`,
    expect:
      "You should get a stakeholder checklist with named owners, blockers, and a go / no-go. Jobs do not auto-chain — you pasted the winner in by hand, which is expected.",
  },
  {
    number: "4",
    title: "Rate Card Normalization",
    goal: "Map the Acme rate card onto the Jet job taxonomy and flag outliers.",
    steps: [
      "Open Templates → Rate Card Normalization → Full / Analyst → Use with demo KB.",
      "Paste the request below and click Run now.",
      "Confirm a normalized table (role / level / rate), unmapped titles, variance flags above 15%, and a challenge list. Rates must come from retrieved context — no invented numbers.",
    ],
    request: `Normalize the Acme Cloud Services Inc. professional-services rate card against the Jet Industries job taxonomy.

Vendor: Acme Cloud Services Inc.
Source docs in KB: Acme rate card 2024 + Jet Industries job taxonomy.

Output requirements:
- Map each vendor title to canonical role + level
- Preserve region, currency, hourly rate, effective date
- Flag unmapped / ambiguous titles
- Produce a clean normalized table Procurement can use for SOW pricing checks
- Call out any rate outliers vs the rest of the card

Do not invent rates that are not in Retrieved Context.`,
    expect:
      "Normalized rows plus unmapped titles and >15% variance flags. This job is independent of the contract/capability chain — run it anytime after demo KB is seeded.",
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
            How to configure, run, and govern Context Jobs — including a staging walkthrough of the four
            procurement features: Contract Review, Supplier Capability, Onboarding, and Rate Cards.
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

        <section className="rounded-[2rem] border border-teal-200 bg-teal-50/70 p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">Staging walkthrough</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Test the four procurement features</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Run these in order on staging. Use the same account. Each feature is a separate job — after a
            run, copy useful lines into the next User request. Prefer{" "}
            <span className="font-semibold">Use with demo KB</span> so you do not need to ingest files first.
            Stay on <span className="font-semibold">Full / Analyst</span> unless you specifically want the
            short Executive brief.
          </p>
          <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-slate-700">
            <li>Confirm an LLM key under Keys and that you can open Templates.</li>
            <li>Contract Review → Capability Matrix → Onboarding Checklist → Rate Card Normalization.</li>
            <li>On Contract Review, scroll past recommendations and confirm Intent Behind the Edits.</li>
          </ol>
        </section>

        <section className="space-y-4">
          {walkthroughs.map((item) => (
            <article
              key={item.title}
              className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Feature {item.number} of 4
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.goal}</p>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
                {item.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Paste into User request
              </p>
              <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-800">
                {item.request}
              </pre>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                <span className="font-semibold text-slate-800">What to expect: </span>
                {item.expect}
              </p>
            </article>
          ))}
        </section>

        <section className="space-y-4">
          {sections.map((section, index) => (
            <article
              key={section.title}
              className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Setup {index + 1}
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
