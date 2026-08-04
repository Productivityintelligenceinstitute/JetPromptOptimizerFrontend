/**
 * Procurement flagship template catalog — groups system templates into
 * 4 families × Full / Executive / Scorecard personas for the gallery.
 */

export type TemplatePersona = "full" | "executive" | "scorecard";

export type TemplateFamilyId =
  | "contract_review"
  | "supplier_capability"
  | "rate_card"
  | "supplier_onboarding";

export type LifecycleGuide = {
  nextJobName: string;
  carryFromResult: string[];
  nextNeeds: string[];
};

export type TemplateFamilyMeta = {
  id: TemplateFamilyId;
  title: string;
  summary: string;
  problem: string;
  outcome: string;
  inputsNeeded: string[];
  workflowTypes: string[];
  /** Next job in the manual procurement lifecycle (shown on Full / Analyst). */
  chainNext?: string;
  lifecycleGuide?: LifecycleGuide;
  demoHint: string;
  /** Shown under Needs chips — how inputs are supplied in the product */
  inputSetupNote?: string;
  /** Base system template name without persona suffix */
  baseName: string;
};

export const PERSONA_META: Record<
  TemplatePersona,
  { label: string; forWhom: string; hint: string }
> = {
  full: {
    label: "Full / Analyst",
    forWhom: "Audit-ready detail",
    hint: "Tables, evidence, full sections",
  },
  executive: {
    label: "Executive",
    forWhom: "Decision brief",
    hint: "Decision, risks, next step — concise",
  },
  scorecard: {
    label: "Scorecard",
    forWhom: "Committee / systems",
    hint: "Structured JSON dimensions",
  },
};

export const LIFECYCLE_OVERVIEW =
  "Procurement lifecycle: Contract Review → Capability Matrix → Onboarding. " +
  "These are separate jobs — after a run, copy the useful sections from the result into the next job’s User request, " +
  "and add that next job’s Needs (documents / names / owners) in the request or knowledge base, then run it. " +
  "That keeps the use-case lifecycle without automatic chaining.";

export const TEMPLATE_FAMILIES: TemplateFamilyMeta[] = [
  {
    id: "contract_review",
    title: "Contract Review & Renewal",
    summary:
      "Primary renewal workload — clause gaps, commercial exposure, and a defensible next action before auto-renewal traps close.",
    problem: "Renewals land late; clause risk and notice windows hide in PDFs.",
    outcome: "Structured renewal assessment (or brief / scorecard) with mandatory-clause gates.",
    inputsNeeded: [
      "Contract — job KB ingest or User request (URL / pasted text)",
      "Policy — ingest into job KB (recommended; generic template policy otherwise)",
      "Optional in User request: vendor, expiry, spend notes",
    ],
    inputSetupNote:
      "Best path: ingest contract + your org policy on the job page (Jet KB or vector connection). Quick try: put a public contract URL or pasted contract text in the User request — contract-analyzer can use it. Policy grounding is strongest when the policy document is in the job KB; User request alone is not a substitute for a full org policy. There is no separate “replace policy” button — ingest your real policy into the job KB.",
    workflowTypes: ["contract_review"],
    chainNext: "Supplier Capability Matrix",
    lifecycleGuide: {
      nextJobName: "Supplier Capability Matrix",
      carryFromResult: [
        "Renew / renegotiate / exit decision (short)",
        "Top contractual and commercial risks",
        "Incumbent vendor + contract id / expiry",
        "Evidence gaps that affect supplier choice",
      ],
      nextNeeds: [
        "2–5 supplier names to compare (in User request)",
        "Vendor profiles or RFP responses in the job KB (or pasted in the request)",
      ],
    },
    demoHint: "Demo KB includes a sample MSA + procurement policy.",
    baseName: "Contract Review & Renewal",
  },
  {
    id: "supplier_capability",
    title: "Supplier Capability Matrix",
    summary:
      "Differentiate suppliers on evidence — not price-only or me-too feature lists — with weighted criteria and recommendation scenarios.",
    problem: "Shortlists collapse to rate sheets; marketing claims go unverified.",
    outcome: "Defensible comparison with me-too flags and evidence gaps called out.",
    inputsNeeded: [
      "2–5 supplier names — User request",
      "Vendor profiles / RFP responses — job KB ingest (recommended)",
      "Or paste capability evidence in User request",
      "Optional in User request: category / evaluation focus",
    ],
    inputSetupNote:
      "Best path: ingest vendor profiles or RFP responses on the job page (Jet KB or vector connection), then name 2–5 suppliers in the User request. Quick try: paste short profiles or RFP excerpts into the User request with the supplier list. This workflow stays grounded in Retrieved Context — it does not use web-search to fill the matrix. Prefer capability evidence over MSA clause dumps — this template is not for contract-analyzer. There is no separate “add suppliers” button — names go in the User request; documents go into the job KB or the request text.",
    workflowTypes: ["supplier_assessment"],
    chainNext: "Supplier Onboarding Checklist",
    lifecycleGuide: {
      nextJobName: "Supplier Onboarding Checklist",
      carryFromResult: [
        "Recommended or shortlisted supplier",
        "Me-too / delivery risk flags",
        "Evidence gaps still open before go-live",
        "Brief commercial or risk posture notes",
      ],
      nextNeeds: [
        "Supplier onboarding packet or vendor profile in the job KB",
        "Internal approval owners (legal / security / finance) in the User request",
      ],
    },
    demoHint: "Demo KB includes two vendor profiles for side-by-side comparison.",
    baseName: "Supplier Capability Matrix",
  },
  {
    id: "rate_card",
    title: "Rate Card Normalization",
    summary:
      "Normalize heterogeneous rate cards onto a job taxonomy, flag >15% variance, and surface spend concentration.",
    problem: "Professional-services pricing lives in bespoke spreadsheets VMS tools cannot parse.",
    outcome: "Normalized card, unmapped roles, variance flags, and challenge list.",
    inputsNeeded: [
      "Rate card CSV/text — job KB (rate_card) or paste in User request",
      "Job taxonomy (role / level / titles) — job KB or paste in User request",
      "Vendor name(s) in User request if missing from the CSV",
      "Optional: additional vendor rate cards to compare",
    ],
    inputSetupNote:
      "Best path: ingest rate card document(s) on the job page (Jet KB or vector connection), plus a job taxonomy document that maps vendor titles to role and level. Quick try: paste CSV/text into the User request with vendor names and rates; include taxonomy title lists if they are not in the KB. The agent consolidates Retrieved Context into vendor/title/level/rate and calls spend-analyzer once — it cannot use doc-reader or file-write to open or stage files. The glossary term “job taxonomy” alone is not the catalog; put the real mapping document in the job KB or paste it. There is no separate “upload rate card” control beyond job KB ingest or pasting into the User request.",
    workflowTypes: ["analysis"],
    demoHint: "Demo KB includes a sample rate card CSV plus a job taxonomy for title mapping.",
    baseName: "Rate Card Normalization",
  },
  {
    id: "supplier_onboarding",
    title: "Supplier Onboarding Checklist",
    summary:
      "Stakeholder onboarding memo with approvals, risk flags, open items, and an explicit go / no-go.",
    problem: "Onboarding stalls in email threads across legal, security, and finance.",
    outcome: "Actionable checklist and go/no-go package — often after a Capability Matrix decision.",
    inputsNeeded: [
      "Supplier onboarding packet / vendor profile — job KB ingest (recommended)",
      "Or paste packet summary in User request",
      "Supplier name + internal approval owners (legal / security / finance) — User request",
      "Optional: go-live context; contract excerpts only if used as onboarding evidence",
    ],
    inputSetupNote:
      "Best path: ingest the supplier onboarding packet or vendor profile on the job page (Jet KB or vector connection), then put the supplier name and internal approval owners (legal, security, finance) in the User request. Quick try: paste a short vendor profile plus owner names into the User request. After a Capability Matrix run, copy the recommended supplier and open risks into this request — jobs are separate; there is no automatic handoff. This template does not run contract-analyzer or web-search; only include MSA text if you intentionally want it as onboarding evidence. There is no separate “owners” or “packet” button — owners in the User request, documents in the job KB or pasted text.",
    workflowTypes: ["procurement"],
    demoHint: "Best after Capability Matrix, or with vendor profiles from the demo KB.",
    baseName: "Supplier Onboarding Checklist",
  },
];

const PERSONA_SUFFIX: Record<Exclude<TemplatePersona, "full">, string> = {
  executive: "(Executive)",
  scorecard: "(Scorecard)",
};

export function classifyTemplateName(
  name: string,
): { familyId: TemplateFamilyId; persona: TemplatePersona } | null {
  const trimmed = name.trim();
  for (const family of TEMPLATE_FAMILIES) {
    if (trimmed === family.baseName) {
      return { familyId: family.id, persona: "full" };
    }
    if (trimmed === `${family.baseName} ${PERSONA_SUFFIX.executive}`) {
      return { familyId: family.id, persona: "executive" };
    }
    if (trimmed === `${family.baseName} ${PERSONA_SUFFIX.scorecard}`) {
      return { familyId: family.id, persona: "scorecard" };
    }
  }
  return null;
}

export function groupTemplatesByFamily<T extends { name: string; id: string }>(
  templates: T[],
): Array<{ family: TemplateFamilyMeta; variants: Partial<Record<TemplatePersona, T>> }> {
  const byFamily = new Map<TemplateFamilyId, Partial<Record<TemplatePersona, T>>>();

  for (const template of templates) {
    const classified = classifyTemplateName(template.name);
    if (!classified) continue;
    const bucket = byFamily.get(classified.familyId) ?? {};
    bucket[classified.persona] = template;
    byFamily.set(classified.familyId, bucket);
  }

  return TEMPLATE_FAMILIES.map((family) => ({
    family,
    variants: byFamily.get(family.id) ?? {},
  })).filter((row) => Object.keys(row.variants).length > 0);
}

export function displayTemplateDescription(
  description: string | null | undefined,
  goal: string | null | undefined,
): string {
  const text = (description || "").trim();
  if (text && !text.toLowerCase().startsWith("system procurement template")) {
    return text;
  }
  return (goal || "").trim() || "No description available yet.";
}
