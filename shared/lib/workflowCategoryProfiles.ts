/**
 * Recommended tool + validation packs by job category (workflow type).
 * Mirrors backend procurement_templates_seed profiles so FE can re-align on category change.
 */

export type WorkflowToolPermission = {
  toolId: string;
  enabled: boolean;
  readOnly: boolean;
  requireApproval?: boolean;
};

export type WorkflowValidationRule = {
  id: string;
  name: string;
  type: string;
  severity: string;
  enabled: boolean;
  checker?: string;
  params?: Record<string, unknown>;
  description?: string;
};

function perm(
  toolId: string,
  opts: { readOnly?: boolean; requireApproval?: boolean } = {},
): WorkflowToolPermission {
  return {
    toolId,
    enabled: true,
    readOnly: opts.readOnly ?? false,
    requireApproval: opts.requireApproval ?? false,
  };
}

const REVIEW_TOOLS: WorkflowToolPermission[] = [
  perm("doc-reader", { readOnly: true }),
  perm("web-search", { readOnly: true }),
  perm("docx-generate"),
  perm("file-write"),
  perm("contract-analyzer", { readOnly: true }),
];

/** Capability matrix — comparison tools, no contract-analyzer. */
const CAPABILITY_TOOLS: WorkflowToolPermission[] = [
  perm("doc-reader", { readOnly: true }),
  perm("web-search", { readOnly: true }),
  perm("docx-generate"),
  perm("file-write"),
];

/** Onboarding checklist — stakeholder package tools. */
const ONBOARDING_TOOLS: WorkflowToolPermission[] = [
  perm("doc-reader", { readOnly: true }),
  perm("docx-generate"),
  perm("file-write"),
];

/** Rate card normalization — restricted spend-analyzer pack. */
const RATE_CARD_TOOLS: WorkflowToolPermission[] = [
  perm("web-search", { readOnly: true }),
  perm("calculator", { readOnly: true }),
  perm("spend-analyzer", { readOnly: true }),
];

const ANALYSIS_RULES: WorkflowValidationRule[] = [
  {
    id: "proc_rate_benchmark",
    name: "Rate benchmark variance",
    type: "procurement",
    checker: "rate_benchmark",
    params: { thresholdPercent: 15 },
    severity: "warning",
    enabled: true,
  },
];

const SUPPLIER_RULES: WorkflowValidationRule[] = [
  {
    id: "proc_risk_threshold_supplier",
    name: "Vendor risk tier threshold",
    type: "procurement",
    checker: "risk_threshold",
    params: { maxRiskTier: "high" },
    severity: "warning",
    enabled: true,
  },
];

const ONBOARDING_RULES: WorkflowValidationRule[] = [
  {
    id: "proc_risk_threshold_onboarding",
    name: "Onboarding risk tier threshold",
    type: "procurement",
    checker: "risk_threshold",
    params: { maxRiskTier: "medium" },
    severity: "warning",
    enabled: true,
  },
];

/** Specialty rule ids that should swap when applying a category profile. */
export const SPECIALTY_VALIDATION_RULE_IDS = new Set([
  "proc_rate_benchmark",
  "proc_risk_threshold",
  "proc_risk_threshold_supplier",
  "proc_risk_threshold_onboarding",
  "proc_mandatory_clauses",
]);

export type WorkflowCategoryProfile = {
  tools: WorkflowToolPermission[];
  specialtyRules: WorkflowValidationRule[];
  summary: string;
};

export const WORKFLOW_CATEGORY_PROFILES: Record<string, WorkflowCategoryProfile> = {
  contract_review: {
    tools: REVIEW_TOOLS,
    specialtyRules: [],
    summary: "Contract tools (contract-analyzer) + review tool set",
  },
  review: {
    tools: REVIEW_TOOLS,
    specialtyRules: [],
    summary: "Review tool set including contract-analyzer",
  },
  analysis: {
    tools: RATE_CARD_TOOLS,
    specialtyRules: ANALYSIS_RULES,
    summary: "Rate-card tools (spend-analyzer) + rate benchmark checks",
  },
  supplier_assessment: {
    tools: CAPABILITY_TOOLS,
    specialtyRules: SUPPLIER_RULES,
    summary: "Capability comparison tools + supplier risk threshold",
  },
  procurement: {
    tools: ONBOARDING_TOOLS,
    specialtyRules: ONBOARDING_RULES,
    summary: "Onboarding checklist tools + onboarding risk threshold",
  },
};

export function getWorkflowCategoryProfile(workflowType: string): WorkflowCategoryProfile | null {
  return WORKFLOW_CATEGORY_PROFILES[workflowType] ?? null;
}

export function mergeSpecialtyValidationRules(
  existing: unknown[],
  specialtyRules: WorkflowValidationRule[],
): unknown[] {
  const kept = existing.filter((rule) => {
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) return true;
    const id = String((rule as { id?: unknown }).id ?? "");
    return !SPECIALTY_VALIDATION_RULE_IDS.has(id);
  });
  return [...kept, ...specialtyRules];
}

export function detectWorkflowCategoryMismatch(
  workflowType: string,
  toolPermissions: unknown[],
): string | null {
  const toolIds = new Set(
    toolPermissions
      .map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return "";
        const record = item as { toolId?: unknown; enabled?: unknown };
        if (record.enabled === false) return "";
        return typeof record.toolId === "string" ? record.toolId : "";
      })
      .filter(Boolean),
  );

  if (workflowType === "contract_review" && !toolIds.has("contract-analyzer")) {
    return "Category is contract review, but contract-analyzer is not enabled. Runs may skip structured clause analysis.";
  }
  if (workflowType === "analysis" && !toolIds.has("spend-analyzer")) {
    return "Category is analysis, but spend-analyzer is not enabled. Rate/spend checks may be weak.";
  }
  if (workflowType === "supplier_assessment" && !toolIds.has("doc-reader")) {
    return "Category is supplier assessment, but doc-reader is not enabled. Capability evidence review may be weak.";
  }
  if (workflowType === "procurement" && !toolIds.has("doc-reader")) {
    return "Category is procurement onboarding, but doc-reader is not enabled. Packet review may be weak.";
  }
  return null;
}
