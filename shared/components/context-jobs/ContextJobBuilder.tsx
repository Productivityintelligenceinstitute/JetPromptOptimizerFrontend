"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/context/AuthContext";
import AuthGuard from "@/shared/components/auth/AuthGuard";
import {
  createContextJob,
  getContextJob,
  getContextJobsLlmKeyModels,
  getContextJobsLlmKeys,
  getContextJobsAssets,
  getContextJobsTools,
  getContextJobsVectorConnections,
  updateContextJob,
  type ContextJob,
  type ContextJobAsset,
  type ContextJobMutationPayload,
  type ContextJobPatchPayload,
  type ContextJobsTool,
  type ContextJobsProviderModel,
  type ContextJobsLlmKey,
  type ContextJobsVectorConnection,
} from "@/shared/api/contextJobs";
import { useContextJobsEntitlements } from "@/shared/hooks/useContextJobsEntitlements";
import { consumeContextJobDraft } from "@/shared/lib/contextJobsDraft";

type BuilderMode = "new" | "edit";
type BuilderStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const STEPS = [
  { id: 0, label: "Purpose", description: "Define the job purpose and core output." },
  { id: 1, label: "Instructions", description: "Add operating instructions and escalation." },
  { id: 2, label: "Terms", description: "Capture glossary terms for the job." },
  { id: 3, label: "Relationships", description: "Describe how concepts connect." },
  { id: 4, label: "Sources", description: "Set retrieval mode and trusted sources." },
  { id: 5, label: "Memory", description: "Tune memory and approval behavior." },
  { id: 6, label: "Tools", description: "Set provider, model, and tool access." },
  { id: 7, label: "Checks", description: "Configure validation and budgets." },
  { id: 8, label: "Review", description: "Check the summary and publish when ready." },
] as const;

const WORKFLOW_TYPES = [
  { value: "standard", label: "Standard" },
  { value: "research", label: "Research" },
  { value: "analysis", label: "Analysis" },
  { value: "generation", label: "Generation" },
  { value: "decision", label: "Decision-support" },
  { value: "extraction", label: "Extraction" },
  { value: "review", label: "Review" },
  { value: "monitoring", label: "Monitoring" },
  { value: "procurement", label: "Procurement" },
  { value: "contract_review", label: "Contract review" },
  { value: "supplier_assessment", label: "Supplier assessment" },
] as const;

const RETRIEVAL_MODES = [
  { value: "jet_kb", label: "Jet KB" },
  { value: "external", label: "External knowledge base" },
] as const;

const EXECUTION_MODES = [
  { value: "single_agent", label: "Single agent" },
  { value: "provider_multi_agent", label: "Provider multi-agent" },
] as const;

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  google: "Google Gemini",
  anthropic: "Anthropic",
};

const TRIAL_MODELS: Record<string, string> = {
  openai: "gpt-4o-mini",
  google: "gemini-2.5-flash",
  anthropic: "claude-haiku-4-5",
};

const GLOSSARY_CATEGORIES = ["general", "domain", "policy", "tooling"] as const;
const RELATIONSHIP_TYPES = ["related_to", "depends_on", "similar_to", "blocks", "supports"] as const;
const SOURCE_KINDS = ["document", "website", "database", "api", "person"] as const;
type ToolPermissionItem = {
  toolId: string;
  enabled: boolean;
  readOnly: boolean;
};

type ToolPermissionSource = {
  id: string;
  label: string;
  readOnly: boolean;
  category?: string | null;
  aliases?: string[];
};

const TOOL_PERMISSION_PRESETS: ToolPermissionSource[] = [
  { id: "file-write", label: "File write", readOnly: false, category: "write", aliases: ["write"] },
  { id: "web-search", label: "Web search", readOnly: true, category: "search", aliases: ["search"] },
  { id: "doc-reader", label: "Document reader", readOnly: true, category: "read", aliases: ["read"] },
  { id: "tool-executor", label: "Tool executor", readOnly: false, category: "execute", aliases: ["execute"] },
  { id: "contract-analyzer", label: "Contract analyzer", readOnly: true, category: "analysis", aliases: ["analyze"] },
  { id: "summarizer", label: "Summarizer", readOnly: true, category: "analysis", aliases: ["summarize"] },
] as const;
const VALIDATION_TYPES = ["groundedness", "format", "policy", "safety", "quality"] as const;
const VALIDATION_SEVERITIES = ["info", "warning", "error"] as const;

const formInputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200";
const formTextareaClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200";

interface BuilderFormState {
  name: string;
  description: string;
  goal: string;
  workflowType: string;
  semanticBlueprint: string;
  outputTemplate: string;
  stableInstructions: string;
  roleConfiguration: string;
  escalationPolicy: string;
  glossaryTermsJson: string;
  relationshipsJson: string;
  trustedSourcesJson: string;
  retrievalMode: string;
  retrievalConfigJson: string;
  vectorConnectionId: string;
  memoryConfigJson: string;
  approvalRequired: boolean;
  policyProfile: string;
  executionProvider: string;
  executionModel: string;
  llmKeyId: string;
  toolPermissionsJson: string;
  validationRulesJson: string;
  budgetSettingsJson: string;
  maxAgentTurns: number;
  executionMode: string;
  assetIds: string[];
  status: string;
}

const defaultFormState: BuilderFormState = {
  name: "",
  description: "",
  goal: "",
  workflowType: "standard",
  semanticBlueprint: "",
  outputTemplate: "",
  stableInstructions: "",
  roleConfiguration: "",
  escalationPolicy: "",
  glossaryTermsJson: "[]",
  relationshipsJson: "[]",
  trustedSourcesJson: "[]",
  retrievalMode: "jet_kb",
  retrievalConfigJson: JSON.stringify(
    {
      sources: [],
      queryRewriting: true,
      hybridRetrieval: true,
      reranking: true,
      maxDocuments: 10,
    },
    null,
    2
  ),
  vectorConnectionId: "",
  memoryConfigJson: JSON.stringify(
    {
      sessionMemory: true,
      projectMemory: false,
      userProfileMemory: false,
      retentionDays: 30,
    },
    null,
    2
  ),
  approvalRequired: false,
  policyProfile: "",
  executionProvider: "",
  executionModel: "",
  llmKeyId: "",
  toolPermissionsJson: "[]",
  validationRulesJson: JSON.stringify(
    [
      {
        id: "groundedness",
        type: "groundedness",
        name: "Groundedness Check",
        description: "Ensure claims are grounded in retrieved evidence",
        enabled: true,
        severity: "error",
      },
    ],
    null,
    2
  ),
  budgetSettingsJson: JSON.stringify(
    {
      maxTokens: 4096,
      maxLatencyMs: 30000,
      maxCostUsd: 0.5,
    },
    null,
    2
  ),
  maxAgentTurns: 6,
  executionMode: "single_agent",
  assetIds: [],
  status: "draft",
};

function parseJsonInput<T>(value: string, fallback: T): T {
  if (!value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function formatErrorMessage(error: unknown): string {
  if (error === null || error === undefined) {
    return "";
  }

  if (typeof error === "string") {
    return error.trim();
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  const fallback = String(error);
  return fallback === "null" || fallback === "undefined" ? "" : fallback;
}

function cleanPayload(payload: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value === "" || value === null || value === undefined) {
        return false;
      }

      if (Array.isArray(value)) {
        return value.length > 0;
      }

      if (typeof value === "object") {
        return Object.keys(value).length > 0;
      }

      return true;
    })
  ) as Record<string, unknown>;
}

function stringifyJsonInput(value: unknown, fallback: string): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return fallback;
  }
}

function parseJsonArray<T>(value: string): T[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function parseJsonRecord<T extends Record<string, unknown>>(value: string, fallback: T): T {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as T;
    }
  } catch {
    // Fall back below.
  }

  return fallback;
}

function countJsonItems(value: string): number {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function resolveToolPermissionSource(value: string, tools: readonly ToolPermissionSource[]): ToolPermissionSource | null {
  return (
    tools.find(
      (tool) =>
        tool.id === value ||
        tool.category === value ||
        tool.aliases?.includes(value) ||
        tool.label.toLowerCase() === value.toLowerCase()
    ) ?? null
  );
}

function normalizeToolPermission(value: unknown, tools: readonly ToolPermissionSource[]): ToolPermissionItem | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    if (typeof value !== "string") return null;

    const legacyMatch = resolveToolPermissionSource(value, tools);
    if (!legacyMatch) return null;

    return {
      toolId: legacyMatch.id,
      enabled: true,
      readOnly: legacyMatch.readOnly,
    };
  }

  const record = value as Record<string, unknown>;
  const toolId =
    (typeof record.toolId === "string" && record.toolId.trim()) ||
    (typeof record.id === "string" && record.id.trim()) ||
    (typeof record.name === "string" && record.name.trim()) ||
    "";

  if (!toolId) return null;

  const resolved = resolveToolPermissionSource(toolId, tools);

  return {
    toolId: resolved?.id ?? toolId,
    enabled: record.enabled !== false,
    readOnly: typeof record.readOnly === "boolean" ? record.readOnly : resolved?.readOnly ?? false,
  };
}

function serializeToolPermissions(value: string, tools: readonly ToolPermissionSource[]): ToolPermissionItem[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => normalizeToolPermission(entry, tools))
      .filter((entry): entry is ToolPermissionItem => Boolean(entry));
  } catch {
    return [];
  }
}

function toolPermissionLabel(toolId: string, tools: readonly ToolPermissionSource[]): string {
  const preset = resolveToolPermissionSource(toolId, tools);
  return preset?.label || toolId;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function getLlmKeyLabel(key: ContextJobsLlmKey): string {
  const baseLabel = key.keyLabel || key.label || key.name || PROVIDER_LABELS[key.provider ?? ""] || "API key";
  const suffix = key.keyLastFour ? ` ••••${key.keyLastFour}` : "";
  return `${baseLabel}${suffix}`;
}

function getVectorConnectionLabel(connection: ContextJobsVectorConnection): string {
  return connection.displayName || connection.name || `${connection.provider || "Connection"} ${connection.id.slice(0, 8)}`;
}

function getAssetLabel(asset: ContextJobAsset): string {
  return `${asset.name} (${asset.type})`;
}

function getAssetContent(asset: ContextJobAsset): Record<string, unknown> | null {
  if (!asset.content || typeof asset.content !== "object" || Array.isArray(asset.content)) {
    return null;
  }

  return asset.content as Record<string, unknown>;
}

function getArrayFromAssetContent(asset: ContextJobAsset): unknown[] {
  const content = getAssetContent(asset);
  if (!content) return [];

  const candidates = ["items", "terms", "patterns", "sources", "relationships", "trustedSources", "knowledgeSources", "data"];
  for (const key of candidates) {
    const value = content[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  if (Array.isArray((content as { content?: unknown }).content)) {
    return (content as { content?: unknown[] }).content ?? [];
  }

  return [];
}

function getStringArrayFromAssetContent(asset: ContextJobAsset): string[] {
  return getArrayFromAssetContent(asset).map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      return (
        (typeof record.name === "string" && record.name) ||
        (typeof record.term === "string" && record.term) ||
        (typeof record.label === "string" && record.label) ||
        ""
      );
    }

    return "";
  }).filter(Boolean);
}

function getRelationshipPatternRows(asset: ContextJobAsset): RelationshipItem[] {
  const content = getAssetContent(asset);
  if (!content) return [];

  const rawPatterns = content.patterns;
  if (!Array.isArray(rawPatterns)) return [];

  return rawPatterns
    .map((pattern) => {
      if (!pattern || typeof pattern !== "object") return null;
      const record = pattern as Record<string, unknown>;
      const source = typeof record.from === "string" ? record.from : typeof record.source === "string" ? record.source : "";
      const target = typeof record.to === "string" ? record.to : typeof record.target === "string" ? record.target : "";
      const relation = typeof record.relation === "string" ? record.relation : "related_to";
      if (!source || !target) return null;
      return { source, relation, target };
    })
    .filter((item): item is RelationshipItem => Boolean(item));
}

function getTrustedSourceFromAsset(asset: ContextJobAsset): TrustedSourceItem | null {
  const content = getAssetContent(asset);
  if (!content) return null;

  const sourceType = typeof content.sourceType === "string" ? content.sourceType : "asset";
  const name = typeof content.name === "string" ? content.name : asset.name;
  const url = typeof content.url === "string" ? content.url : "";

  if (!name && !url) return null;

  return {
    name,
    url,
    kind: sourceType,
  };
}

type GlossaryTermItem = {
  term: string;
  definition: string;
  category: string;
};

type RelationshipItem = {
  source: string;
  relation: string;
  target: string;
};

type TrustedSourceItem = {
  name: string;
  url: string;
  kind: string;
};

type ValidationRuleItem = {
  name: string;
  type: string;
  severity: string;
  enabled: boolean;
};

function importGlossaryTermsFromAsset(asset: ContextJobAsset): GlossaryTermItem[] {
  const rows = getArrayFromAssetContent(asset);
  return rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const record = row as Record<string, unknown>;
      const term = typeof record.term === "string" ? record.term : typeof record.name === "string" ? record.name : "";
      if (!term) return null;
      return {
        term,
        definition: typeof record.definition === "string" ? record.definition : "",
        category: typeof record.category === "string" ? record.category : asset.type,
      };
    })
    .filter((item): item is GlossaryTermItem => Boolean(item));
}

function importTrustedSourcesFromAsset(asset: ContextJobAsset): TrustedSourceItem[] {
  const rows = getArrayFromAssetContent(asset);
  return rows
    .map((row) => {
      if (!row) return null;
      if (typeof row === "string") {
        return { name: row, url: "", kind: asset.type };
      }
      if (typeof row !== "object") return null;
      const record = row as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name : typeof record.label === "string" ? record.label : "";
      if (!name) return null;
      return {
        name,
        url: typeof record.url === "string" ? record.url : typeof record.value === "string" ? record.value : "",
        kind: typeof record.sourceType === "string" ? record.sourceType : asset.type,
      };
    })
    .filter((item): item is TrustedSourceItem => Boolean(item));
}

function buildPayload(form: BuilderFormState, tools: readonly ToolPermissionSource[]): ContextJobMutationPayload {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    goal: form.goal.trim(),
    semanticBlueprint: form.semanticBlueprint.trim(),
    outputTemplate: form.outputTemplate.trim(),
    workflowType: form.workflowType.trim(),
    stableInstructions: form.stableInstructions.trim(),
    roleConfiguration: form.roleConfiguration.trim(),
    retrievalConfig: parseJsonInput<Record<string, unknown>>(form.retrievalConfigJson, {}),
    retrievalMode: form.retrievalMode.trim(),
    vectorConnectionId: form.vectorConnectionId.trim(),
    memoryConfig: parseJsonInput<Record<string, unknown>>(form.memoryConfigJson, {}),
    toolPermissions: serializeToolPermissions(form.toolPermissionsJson, tools),
    validationRules: parseJsonInput<unknown[]>(form.validationRulesJson, []),
    escalationPolicy: form.escalationPolicy.trim(),
    budgetSettings: parseJsonInput<Record<string, unknown>>(form.budgetSettingsJson, {}),
    glossaryTerms: parseJsonInput<unknown[]>(form.glossaryTermsJson, []),
    relationships: parseJsonInput<unknown[]>(form.relationshipsJson, []),
    trustedSources: parseJsonInput<unknown[]>(form.trustedSourcesJson, []),
    approvalRequired: form.approvalRequired,
    policyProfile: form.policyProfile.trim(),
    executionProvider: form.executionProvider.trim(),
    executionModel: form.executionModel.trim(),
    llmKeyId: form.llmKeyId.trim(),
    maxAgentTurns: Number.isFinite(form.maxAgentTurns) ? form.maxAgentTurns : 6,
    executionMode: form.executionMode.trim(),
    assetIds: form.assetIds,
    status: form.status,
  };
}

function buildCreatePayload(form: BuilderFormState, tools: readonly ToolPermissionSource[]): ContextJobMutationPayload {
  const payload = cleanPayload(buildPayload(form, tools) as unknown as Record<string, unknown>);
  delete payload.status;
  return payload as ContextJobMutationPayload;
}

function buildPatchPayload(
  current: BuilderFormState,
  baseline: BuilderFormState | null,
  tools: readonly ToolPermissionSource[]
): ContextJobPatchPayload {
  const currentPayload = buildPayload(current, tools);
  delete currentPayload.status;
  if (!baseline) {
    return currentPayload;
  }

  const baselinePayload = buildPayload(baseline, tools);
  delete baselinePayload.status;
  const patch: ContextJobPatchPayload = {};

  for (const [key, value] of Object.entries(currentPayload)) {
    const baselineValue = baselinePayload[key];
    const isChanged = JSON.stringify(value) !== JSON.stringify(baselineValue);

    if (!isChanged) continue;

    if (typeof value === "string") {
      patch[key] = value.trim() ? value : null;
      continue;
    }

    if (Array.isArray(value)) {
      patch[key] = value;
      continue;
    }

    if (value && typeof value === "object") {
      patch[key] = value;
      continue;
    }

    patch[key] = value;
  }

  return patch;
}

function loadFormFromJob(job: ContextJob): BuilderFormState {
  const retrievalMode = job.retrievalMode === "external" ? "external" : "jet_kb";
  const executionMode = job.executionMode === "provider_multi_agent" ? "provider_multi_agent" : "single_agent";

  return {
    name: job.name ?? "",
    description: job.description ?? "",
    goal: job.goal ?? "",
    workflowType: job.workflowType ?? "standard",
    semanticBlueprint: job.semanticBlueprint ?? "",
    outputTemplate: job.outputTemplate ?? "",
    stableInstructions: job.stableInstructions ?? "",
    roleConfiguration: job.roleConfiguration ?? "",
    escalationPolicy: job.escalationPolicy ?? "",
    glossaryTermsJson: stringifyJsonInput(job.glossaryTerms, "[]"),
    relationshipsJson: stringifyJsonInput(job.relationships, "[]"),
    trustedSourcesJson: stringifyJsonInput(job.trustedSources, "[]"),
    retrievalMode,
    retrievalConfigJson: stringifyJsonInput(job.retrievalConfig, "{}"),
    vectorConnectionId: job.vectorConnectionId ?? "",
    memoryConfigJson: stringifyJsonInput(job.memoryConfig, "{}"),
    approvalRequired: Boolean(job.approvalRequired),
    policyProfile: job.policyProfile ?? "",
    executionProvider: job.executionProvider ?? "",
    executionModel: job.executionModel ?? "",
    llmKeyId: job.llmKeyId ?? "",
    toolPermissionsJson: stringifyJsonInput(job.toolPermissions, "[]"),
    validationRulesJson: stringifyJsonInput(job.validationRules, "[]"),
    budgetSettingsJson: stringifyJsonInput(job.budgetSettings, "{}"),
    maxAgentTurns: job.maxAgentTurns ?? 6,
    executionMode,
    assetIds: job.assetIds ?? [],
    status: job.status ?? "draft",
  };
}

function loadFormFromDraft(draft: Record<string, unknown>): BuilderFormState {
  const nextForm = { ...defaultFormState };
  const record = draft as Record<string, unknown>;
  const formRecord = nextForm as Record<string, unknown>;

  const stringFields: Array<keyof BuilderFormState> = [
    "name",
    "description",
    "goal",
    "workflowType",
    "semanticBlueprint",
    "outputTemplate",
    "stableInstructions",
    "roleConfiguration",
    "escalationPolicy",
    "retrievalMode",
    "vectorConnectionId",
    "policyProfile",
    "executionProvider",
    "executionModel",
    "llmKeyId",
    "status",
  ];

  for (const field of stringFields) {
    const value = record[field];
    if (typeof value === "string") {
      formRecord[field] = value;
    }
  }

  if (typeof record.approvalRequired === "boolean") {
    formRecord.approvalRequired = record.approvalRequired;
  }

  if (typeof record.maxAgentTurns === "number" && Number.isFinite(record.maxAgentTurns)) {
    formRecord.maxAgentTurns = record.maxAgentTurns;
  }

  if (typeof record.executionMode === "string") {
    formRecord.executionMode = record.executionMode;
  }

  if (Array.isArray(record.assetIds)) {
    formRecord.assetIds = record.assetIds.filter((item): item is string => typeof item === "string");
  }

  const jsonFieldMap: Array<[string, string, string]> = [
    ["retrievalConfigJson", "{}", "retrievalConfig"],
    ["memoryConfigJson", "{}", "memoryConfig"],
    ["toolPermissionsJson", "[]", "toolPermissions"],
    ["validationRulesJson", "[]", "validationRules"],
    ["budgetSettingsJson", "{}", "budgetSettings"],
    ["glossaryTermsJson", "[]", "glossaryTerms"],
    ["relationshipsJson", "[]", "relationships"],
    ["trustedSourcesJson", "[]", "trustedSources"],
  ];

  for (const [formKey, fallbackKey, draftKey] of jsonFieldMap) {
    const value = record[draftKey];
    if (value === undefined || value === null) {
      continue;
    }

    formRecord[formKey] = typeof value === "string" ? value : stringifyJsonInput(value, fallbackKey);
  }

  return nextForm;
}

function BuilderContent({ mode, jobId }: { mode: BuilderMode; jobId?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const entitlements = useContextJobsEntitlements();
  const plan = (entitlements.plan ?? "").toLowerCase();
  const [step, setStep] = useState<BuilderStep>(0);
  const [form, setForm] = useState<BuilderFormState>(defaultFormState);
  const [baselineForm, setBaselineForm] = useState<BuilderFormState | null>(mode === "edit" ? null : defaultFormState);
  const [job, setJob] = useState<ContextJob | null>(null);
  const [isLoadingJob, setIsLoadingJob] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [llmKeys, setLlmKeys] = useState<ContextJobsLlmKey[]>([]);
  const [keyModels, setKeyModels] = useState<ContextJobsProviderModel[]>([]);
  const [vectorConnections, setVectorConnections] = useState<ContextJobsVectorConnection[]>([]);
  const [assets, setAssets] = useState<ContextJobAsset[]>([]);
  const [allowedTools, setAllowedTools] = useState<ContextJobsTool[]>([]);
  const [isLoadingLlmKeys, setIsLoadingLlmKeys] = useState(false);
  const [isLoadingKeyModels, setIsLoadingKeyModels] = useState(false);
  const [isLoadingVectorConnections, setIsLoadingVectorConnections] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [glossaryDraft, setGlossaryDraft] = useState<{ term: string; definition: string; category: string }>({
    term: "",
    definition: "",
    category: GLOSSARY_CATEGORIES[0],
  });
  const [relationshipDraft, setRelationshipDraft] = useState<{ source: string; relation: string; target: string }>({
    source: "",
    relation: RELATIONSHIP_TYPES[0],
    target: "",
  });
  const [trustedSourceDraft, setTrustedSourceDraft] = useState<{ name: string; url: string; kind: string }>({
    name: "",
    url: "",
    kind: SOURCE_KINDS[0],
  });
  const [validationRuleDraft, setValidationRuleDraft] = useState<{ name: string; type: string; severity: string }>({
    name: "",
    type: VALIDATION_TYPES[0],
    severity: VALIDATION_SEVERITIES[2],
  });
  const draftPrefillAppliedRef = useRef(false);
  const isFirstStep = step === STEPS[0].id;
  const isLastStep = step === STEPS[STEPS.length - 1].id;

  const goToPreviousStep = (): void => {
    setStep((current) => Math.max(STEPS[0].id, current - 1) as BuilderStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToNextStep = (): void => {
    setStep((current) => Math.min(STEPS[STEPS.length - 1].id, current + 1) as BuilderStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (mode !== "edit" || !jobId) return;

    let mounted = true;

    const loadJob = async (): Promise<void> => {
      try {
        setIsLoadingJob(true);
        const data = await getContextJob(jobId);
        if (!mounted) return;
        setJob(data);
        const nextForm = loadFormFromJob(data);
        setForm(nextForm);
        setBaselineForm(nextForm);
      } catch (err) {
        if (!mounted) return;
        setError(err);
      } finally {
        if (mounted) {
          setIsLoadingJob(false);
        }
      }
    };

    void loadJob();

    return () => {
      mounted = false;
    };
  }, [jobId, mode]);

  useEffect(() => {
    if (mode !== "new" || draftPrefillAppliedRef.current) return;

    const draft = consumeContextJobDraft();
    if (!draft) return;

    draftPrefillAppliedRef.current = true;
    const nextForm = loadFormFromDraft(draft.payload);
    setForm(nextForm);
    setBaselineForm(defaultFormState);
  }, [mode]);

  useEffect(() => {
    if (mode !== "new") return;
    if (draftPrefillAppliedRef.current) return;
    if (form.executionProvider) return;

    const firstProvider = entitlements.providers.find((item) => item.selectable) ?? entitlements.providers[0];
    const nextProvider = firstProvider?.provider ?? "openai";

    setForm((current) => ({
      ...current,
      executionProvider: nextProvider,
      executionModel: plan === "trial" ? (TRIAL_MODELS[nextProvider] ?? "") : current.executionModel,
      llmKeyId: plan === "trial" ? "" : current.llmKeyId,
    }));
  }, [entitlements.providers, form.executionProvider, mode, plan]);

  useEffect(() => {
    if (!form.executionProvider) return;

    if (plan === "trial") {
      const trialModel = TRIAL_MODELS[form.executionProvider] ?? "";
      setForm((current) => {
        if (current.executionModel === trialModel && current.llmKeyId === "") {
          return current;
        }

        return {
          ...current,
          executionModel: trialModel,
          llmKeyId: "",
        };
      });
      return;
    }

    let mounted = true;

    const loadKeys = async (): Promise<void> => {
      try {
        setIsLoadingLlmKeys(true);
        setLlmKeys([]);
        const keys = await getContextJobsLlmKeys(form.executionProvider);
        if (!mounted) return;
        setLlmKeys(keys);

        setForm((current) => {
          if (keys.length === 0) {
            return {
              ...current,
              llmKeyId: "",
              executionModel: "",
            };
          }

          if (keys.some((key) => key.id === current.llmKeyId)) {
            return current;
          }

          if (mode !== "new") {
            if (!current.llmKeyId) {
              return current;
            }

            return {
              ...current,
              llmKeyId: "",
              executionModel: "",
            };
          }

          return {
            ...current,
            llmKeyId: keys[0].id,
            executionModel: "",
          };
        });
      } catch (err) {
        if (mounted) {
          setError(err);
        }
      } finally {
        if (mounted) {
          setIsLoadingLlmKeys(false);
        }
      }
    };

    void loadKeys();

    return () => {
      mounted = false;
    };
  }, [form.executionProvider, mode, plan]);

  useEffect(() => {
    if (plan !== "pro" || !form.llmKeyId) {
      setKeyModels([]);
      return;
    }

    let mounted = true;

    const loadModels = async (): Promise<void> => {
      try {
        setIsLoadingKeyModels(true);
        setKeyModels([]);
        const models = await getContextJobsLlmKeyModels(form.llmKeyId);
        if (!mounted) return;
        setKeyModels(models);
        setForm((current) => {
          if (models.length === 0) {
            return current;
          }

          if (models.some((model) => model.id === current.executionModel)) {
            return current;
          }

          return {
            ...current,
            executionModel: models[0].id,
          };
        });
      } catch (err) {
        if (mounted) {
          setError(err);
        }
      } finally {
        if (mounted) {
          setIsLoadingKeyModels(false);
        }
      }
    };

    void loadModels();

    return () => {
      mounted = false;
    };
  }, [form.llmKeyId, plan]);

  useEffect(() => {
    let mounted = true;

    const loadVectorConnections = async (): Promise<void> => {
      try {
        setIsLoadingVectorConnections(true);
        const connections = await getContextJobsVectorConnections();
        if (!mounted) return;
        setVectorConnections(connections);
      } catch (err) {
        if (mounted) {
          setError(err);
        }
      } finally {
        if (mounted) {
          setIsLoadingVectorConnections(false);
        }
      }
    };

    void loadVectorConnections();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadTools = async (): Promise<void> => {
      try {
        setIsLoadingTools(true);
        const data = await getContextJobsTools();
        if (!mounted) return;
        setAllowedTools(data);
      } catch (err) {
        if (mounted) {
          setError(err);
        }
      } finally {
        if (mounted) {
          setIsLoadingTools(false);
        }
      }
    };

    void loadTools();

    return () => {
      mounted = false;
    };
  }, []);

  const glossaryAssets = useMemo(() => assets.filter((asset) => asset.type === "glossary"), [assets]);
  const patternAssets = useMemo(() => assets.filter((asset) => asset.type === "relationship_pattern"), [assets]);
  const sourceProfileAssets = useMemo(
    () => assets.filter((asset) => asset.type === "source_profile" || asset.type === "source"),
    [assets]
  );
  const linkedAssetOptions = useMemo(() => assets, [assets]);
  const toolCatalog = useMemo<ToolPermissionSource[]>(
    () =>
      allowedTools.length
        ? allowedTools.map((tool) => ({
            id: tool.id,
            label: tool.name,
            readOnly: Boolean(tool.isReadOnly),
            category: tool.category ?? null,
          }))
        : TOOL_PERMISSION_PRESETS,
    [allowedTools]
  );

  useEffect(() => {
    let mounted = true;

    const loadAssets = async (): Promise<void> => {
      try {
        setIsLoadingAssets(true);
        const data = await getContextJobsAssets();
        if (!mounted) return;
        setAssets(data);
      } catch (err) {
        if (mounted) {
          setError(err);
        }
      } finally {
        if (mounted) {
          setIsLoadingAssets(false);
        }
      }
    };

    void loadAssets();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (form.retrievalMode !== "external") return;
    if (!vectorConnections.length) return;

    const hasSelectedConnection = vectorConnections.some((connection) => connection.id === form.vectorConnectionId);
    if (hasSelectedConnection) return;

    if (mode !== "new") {
      if (!form.vectorConnectionId) {
        return;
      }

      setForm((current) => ({
        ...current,
        vectorConnectionId: "",
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      vectorConnectionId: vectorConnections[0].id,
    }));
  }, [form.retrievalMode, form.vectorConnectionId, mode, vectorConnections]);

  const summary = useMemo(() => {
    const trustedSourcesCount = countJsonItems(form.trustedSourcesJson);
    const glossaryCount = countJsonItems(form.glossaryTermsJson);
    const relationshipCount = countJsonItems(form.relationshipsJson);
    const toolCount = countJsonItems(form.toolPermissionsJson);
    const checkCount = countJsonItems(form.validationRulesJson);
    const memoryEnabled = parseJsonInput<Record<string, unknown>>(form.memoryConfigJson, {}).sessionMemory !== false;

    return [
      { label: "Status", value: form.status },
      { label: "Provider", value: PROVIDER_LABELS[form.executionProvider] || form.executionProvider || "Not set" },
      { label: "Model", value: form.executionModel || "Not set" },
      { label: "Terms", value: String(glossaryCount) },
      { label: "Relationships", value: String(relationshipCount) },
      { label: "Sources", value: String(trustedSourcesCount) },
      { label: "Tools", value: String(toolCount) },
      { label: "Checks", value: String(checkCount) },
      { label: "Memory", value: memoryEnabled ? "On" : "Off" },
    ];
  }, [
    form.executionModel,
    form.executionProvider,
    form.glossaryTermsJson,
    form.memoryConfigJson,
    form.relationshipsJson,
    form.status,
    form.toolPermissionsJson,
    form.trustedSourcesJson,
    form.validationRulesJson,
  ]);

  const providerOptions = useMemo(
    () =>
      {
        const selectableProviders = entitlements.providers
          .filter((provider) => provider.selectable)
          .map((provider) => ({
            value: provider.provider,
            label: provider.displayName,
          }));

        const resolvedProviders = selectableProviders.length
          ? selectableProviders
          : Object.entries(PROVIDER_LABELS).map(([value, label]) => ({ value, label }));

        if (form.executionProvider && !resolvedProviders.some((provider) => provider.value === form.executionProvider)) {
          return [
            ...resolvedProviders,
            {
              value: form.executionProvider,
              label: PROVIDER_LABELS[form.executionProvider] || form.executionProvider,
            },
          ];
        }

        return resolvedProviders;
      },
    [entitlements.providers, form.executionProvider]
  );
  const selectedTrialModel = TRIAL_MODELS[form.executionProvider] || "Not set";
  const errorMessage = formatErrorMessage(error);

  const handleChange = <K extends keyof BuilderFormState>(key: K, value: BuilderFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateJsonArrayField = <T,>(field: keyof Pick<BuilderFormState, "glossaryTermsJson" | "relationshipsJson" | "trustedSourcesJson" | "toolPermissionsJson" | "validationRulesJson">, nextItems: T[]): void => {
    setForm((current) => ({
      ...current,
      [field]: JSON.stringify(nextItems, null, 2),
    }));
  };

  const glossaryTerms = useMemo(() => parseJsonArray<GlossaryTermItem>(form.glossaryTermsJson), [form.glossaryTermsJson]);
  const relationships = useMemo(() => parseJsonArray<RelationshipItem>(form.relationshipsJson), [form.relationshipsJson]);
  const trustedSources = useMemo(() => parseJsonArray<TrustedSourceItem>(form.trustedSourcesJson), [form.trustedSourcesJson]);
  const toolPermissions = useMemo(
    () =>
      parseJsonArray<unknown>(form.toolPermissionsJson)
        .map((entry) => normalizeToolPermission(entry, toolCatalog))
        .filter((entry): entry is ToolPermissionItem => Boolean(entry)),
    [form.toolPermissionsJson, toolCatalog]
  );
  const validationRules = useMemo(() => parseJsonArray<ValidationRuleItem>(form.validationRulesJson), [form.validationRulesJson]);
  const retrievalConfig = useMemo(
    () =>
      parseJsonRecord<Record<string, unknown>>(form.retrievalConfigJson, {
        sources: [],
        queryRewriting: true,
        hybridRetrieval: true,
        reranking: true,
        maxDocuments: 10,
      }),
    [form.retrievalConfigJson]
  );
  const memoryConfig = useMemo(
    () =>
      parseJsonRecord<Record<string, unknown>>(form.memoryConfigJson, {
        sessionMemory: true,
        projectMemory: false,
        userProfileMemory: false,
        retentionDays: 30,
      }),
    [form.memoryConfigJson]
  );
  const budgetSettings = useMemo(
    () =>
      parseJsonRecord<Record<string, unknown>>(form.budgetSettingsJson, {
        maxTokens: 4096,
        maxLatencyMs: 30000,
        maxCostUsd: 0.5,
      }),
    [form.budgetSettingsJson]
  );
  const hasUnsavedChanges = useMemo(() => {
    if (mode === "new") {
      return true;
    }

    if (!baselineForm) {
      return false;
    }

    return Object.keys(buildPatchPayload(form, baselineForm, toolCatalog)).length > 0;
  }, [baselineForm, form, mode, toolCatalog]);

  const isJobReadyToSave = useMemo(() => {
    const hasName = form.name.trim().length > 0;
    const hasWorkflowType = form.workflowType.trim().length > 0;
    const hasRetrievalMode = form.retrievalMode.trim().length > 0;
    const hasVectorConnection = form.retrievalMode !== "external" || form.vectorConnectionId.trim().length > 0;
    const hasExecutionProvider = form.executionProvider.trim().length > 0;
    const hasExecutionMode = form.executionMode.trim().length > 0;
    const hasExecutionModel = plan === "trial" ? selectedTrialModel.trim().length > 0 : form.executionModel.trim().length > 0;
    const hasLlmKey = plan === "pro" ? (llmKeys.length > 0 ? form.llmKeyId.trim().length > 0 : true) : true;

    return (
      hasName &&
      hasWorkflowType &&
      hasRetrievalMode &&
      hasVectorConnection &&
      hasExecutionProvider &&
      hasExecutionMode &&
      hasExecutionModel &&
      hasLlmKey
    );
  }, [form, llmKeys.length, plan, selectedTrialModel]);

  const isSaveDisabled = isSaving || (mode === "edit" && !hasUnsavedChanges) || !isJobReadyToSave;

  const handleExecutionProviderChange = (provider: string): void => {
    setForm((current) => ({
      ...current,
      executionProvider: provider,
      llmKeyId: "",
      executionModel: plan === "trial" ? (TRIAL_MODELS[provider] ?? "") : "",
    }));
  };

  const handleRetrievalModeChange = (retrievalMode: string): void => {
    setForm((current) => ({
      ...current,
      retrievalMode,
      vectorConnectionId: retrievalMode === "external" ? current.vectorConnectionId : "",
    }));
  };

  const handleExecutionModeChange = (executionMode: string): void => {
    setForm((current) => ({ ...current, executionMode }));
  };

  const handleLlmKeyChange = (llmKeyId: string): void => {
    setForm((current) => ({
      ...current,
      llmKeyId,
      executionModel: "",
    }));
  };

  const handleVectorConnectionChange = (vectorConnectionId: string): void => {
    setForm((current) => ({ ...current, vectorConnectionId }));
  };

  const handleAssetSelection = (assetId: string): void => {
    if (!assetId) return;
    setForm((current) => ({
      ...current,
      assetIds: current.assetIds.includes(assetId) ? current.assetIds : [...current.assetIds, assetId],
    }));
  };

  const removeAssetSelection = (assetId: string): void => {
    setForm((current) => ({
      ...current,
      assetIds: current.assetIds.filter((selectedId) => selectedId !== assetId),
    }));
  };

  const addGlossaryTerm = (): void => {
    if (!glossaryDraft.term.trim()) return;

    const nextItems = [
      ...glossaryTerms,
      {
        term: glossaryDraft.term.trim(),
        definition: glossaryDraft.definition.trim(),
        category: glossaryDraft.category,
      },
    ];
    updateJsonArrayField("glossaryTermsJson", nextItems);
    setGlossaryDraft({ term: "", definition: "", category: glossaryDraft.category });
  };

  const removeGlossaryTerm = (index: number): void => {
    updateJsonArrayField("glossaryTermsJson", glossaryTerms.filter((_, itemIndex) => itemIndex !== index));
  };

  const addRelationship = (): void => {
    if (!relationshipDraft.source.trim() || !relationshipDraft.target.trim()) return;
    if (relationshipDraft.source === "__custom__" || relationshipDraft.target === "__custom__") return;

    const nextItems = [
      ...relationships,
      {
        source: relationshipDraft.source.trim(),
        relation: relationshipDraft.relation,
        target: relationshipDraft.target.trim(),
      },
    ];
    updateJsonArrayField("relationshipsJson", nextItems);
    setRelationshipDraft({ source: "", relation: relationshipDraft.relation, target: "" });
  };

  const removeRelationship = (index: number): void => {
    updateJsonArrayField("relationshipsJson", relationships.filter((_, itemIndex) => itemIndex !== index));
  };

  const addTrustedSource = (): void => {
    if (!trustedSourceDraft.name.trim()) return;

    const nextItems = [
      ...trustedSources,
      {
        name: trustedSourceDraft.name.trim(),
        url: trustedSourceDraft.url.trim(),
        kind: trustedSourceDraft.kind,
      },
    ];
    updateJsonArrayField("trustedSourcesJson", nextItems);
    setTrustedSourceDraft({ name: "", url: "", kind: trustedSourceDraft.kind });
  };

  const removeTrustedSource = (index: number): void => {
    updateJsonArrayField("trustedSourcesJson", trustedSources.filter((_, itemIndex) => itemIndex !== index));
  };

  const toggleToolPermission = (toolId: string): void => {
    if (toolPermissions.some((item) => item.toolId === toolId)) {
      updateJsonArrayField(
        "toolPermissionsJson",
        toolPermissions.filter((item) => item.toolId !== toolId)
      );
      return;
    }

    const preset = resolveToolPermissionSource(toolId, toolCatalog);
    updateJsonArrayField("toolPermissionsJson", [
      ...toolPermissions,
      {
        toolId: preset?.id ?? toolId,
        enabled: true,
        readOnly: preset?.readOnly ?? false,
      },
    ]);
  };

  const addValidationRule = (): void => {
    if (!validationRuleDraft.name.trim()) return;

    const nextItems = [
      ...validationRules,
      {
        name: validationRuleDraft.name.trim(),
        type: validationRuleDraft.type,
        severity: validationRuleDraft.severity,
        enabled: true,
      },
    ];
    updateJsonArrayField("validationRulesJson", nextItems);
    setValidationRuleDraft({ name: "", type: validationRuleDraft.type, severity: validationRuleDraft.severity });
  };

  const removeValidationRule = (index: number): void => {
    updateJsonArrayField("validationRulesJson", validationRules.filter((_, itemIndex) => itemIndex !== index));
  };

  const importGlossaryAsset = (assetId: string): void => {
    const asset = glossaryAssets.find((item) => item.id === assetId);
    if (!asset) return;

    const imported = importGlossaryTermsFromAsset(asset);
    if (!imported.length) return;

    const existing = new Set(glossaryTerms.map((term) => term.term.toLowerCase()));
    const nextItems = [...glossaryTerms, ...imported.filter((item) => !existing.has(item.term.toLowerCase()))];
    updateJsonArrayField("glossaryTermsJson", nextItems);
  };

  const importRelationshipPattern = (assetId: string): void => {
    const asset = patternAssets.find((item) => item.id === assetId);
    if (!asset) return;

    const imported = getRelationshipPatternRows(asset);
    if (!imported.length) return;

    const existing = new Set(relationships.map((item) => `${item.source}|${item.relation}|${item.target}`.toLowerCase()));
    const nextItems = [...relationships, ...imported.filter((item) => !existing.has(`${item.source}|${item.relation}|${item.target}`.toLowerCase()))];
    updateJsonArrayField("relationshipsJson", nextItems);
  };

  const importTrustedSourceAsset = (assetId: string): void => {
    const asset = sourceProfileAssets.find((item) => item.id === assetId);
    if (!asset) return;

    const imported = getTrustedSourceFromAsset(asset);
    if (!imported) return;

    const existing = new Set(trustedSources.map((item) => item.name.toLowerCase()));
    if (existing.has(imported.name.toLowerCase())) return;
    updateJsonArrayField("trustedSourcesJson", [...trustedSources, imported]);
  };

  const updateRetrievalConfig = (updates: Partial<Record<string, unknown>>): void => {
    setForm((current) => {
      const currentConfig = parseJsonRecord<Record<string, unknown>>(current.retrievalConfigJson, {});
      return {
        ...current,
        retrievalConfigJson: JSON.stringify({ ...currentConfig, ...updates }, null, 2),
      };
    });
  };

  const updateMemoryConfig = (updates: Partial<Record<string, unknown>>): void => {
    setForm((current) => {
      const currentConfig = parseJsonRecord<Record<string, unknown>>(current.memoryConfigJson, {});
      return {
        ...current,
        memoryConfigJson: JSON.stringify({ ...currentConfig, ...updates }, null, 2),
      };
    });
  };

  const updateBudgetSettings = (updates: Partial<Record<string, unknown>>): void => {
    setForm((current) => {
      const currentConfig = parseJsonRecord<Record<string, unknown>>(current.budgetSettingsJson, {});
      return {
        ...current,
        budgetSettingsJson: JSON.stringify({ ...currentConfig, ...updates }, null, 2),
      };
    });
  };

  const handleSave = async (nextStatus?: string): Promise<void> => {
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!form.workflowType.trim()) {
      setError("Workflow type is required.");
      return;
    }

    if (!form.retrievalMode.trim()) {
      setError("Retrieval mode is required.");
      return;
    }

    if (form.retrievalMode === "external" && !form.vectorConnectionId.trim()) {
      setError("Vector connection is required when retrieval mode is External.");
      return;
    }

    if (!form.executionProvider.trim()) {
      setError("Execution provider is required.");
      return;
    }

    if (!form.executionMode.trim()) {
      setError("Execution mode is required.");
      return;
    }

    if (plan === "pro" && llmKeys.length > 0 && !form.llmKeyId.trim()) {
      setError("Select an API key for the chosen provider.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const nextForm = { ...form, status: nextStatus ?? form.status };

      const saved = mode === "edit" && jobId
        ? (() => {
            const payload = buildPatchPayload(nextForm, baselineForm, toolCatalog);
            if (Object.keys(payload).length === 0) {
              setError("No changes to save.");
              return null;
            }

            return updateContextJob(jobId, payload);
          })()
        : createContextJob(buildCreatePayload(nextForm, toolCatalog));

      if (!saved) {
        return;
      }

      const resolvedSaved = await saved;

      setJob(resolvedSaved);
      router.push(`/context-jobs/jobs/${resolvedSaved.id}`);
    } catch (err) {
      setError(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (mode === "edit" && isLoadingJob) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_42%),linear-gradient(180deg,_#f8fbff_0%,_#f5f7fb_100%)]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-sm backdrop-blur">
            <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
            <div className="mt-6 h-64 animate-pulse rounded-3xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_42%),linear-gradient(180deg,_#f8fbff_0%,_#f5f7fb_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <Link href="/context-jobs/jobs" className="text-sm font-medium text-blue-700 hover:text-blue-900">
              Back to jobs
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {mode === "edit" ? "Edit Context Job" : "New Context Job"}
            </h1>
            <p className="text-sm leading-6 text-slate-600 sm:text-base">
              {mode === "edit"
                ? "Adjust the builder steps, keep the summary map in view, and save or publish from the review step."
                : "Use the same builder flow as the prototype: a guided setup with a live summary and a clean draft-to-publish flow."}
            </p>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">User</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{user?.name || user?.email || "Current user"}</p>
            <p className="mt-1 text-xs text-slate-500">{mode === "edit" && job ? `Version ${job.version}` : "Draft builder"}</p>
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        ) : null}

        {entitlements.status === "succeeded" && !entitlements.contextJobsEnabled ? (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Upgrade required</p>
            <h2 className="mt-3 text-2xl font-semibold text-amber-950">Context Jobs are not enabled for this account</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-900/80">
              Your current plan does not allow Context Jobs access. Upgrade to Pro to create and edit jobs here.
            </p>
          </div>
        ) : null}

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
          <section className="min-w-0 rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="flex max-w-full flex-nowrap gap-2 overflow-x-auto pb-2">
              {STEPS.map((item) => {
                const active = item.id === step;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStep(item.id)}
                    className={`min-w-[11rem] shrink-0 rounded-2xl border px-4 py-3 text-left transition-colors ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-xs font-medium uppercase tracking-[0.2em] opacity-70">{item.label}</span>
                    <span className="mt-1 block text-sm">{item.description}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-6">
              {step === 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Name" required>
                    <input
                      className={formInputClass}
                      placeholder="Enter a job name"
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                    />
                  </Field>
                  <Field label="Workflow type" required>
                    <select className={formInputClass} value={form.workflowType} onChange={(e) => handleChange("workflowType", e.target.value)}>
                      {WORKFLOW_TYPES.map((workflow) => (
                        <option key={workflow.value} value={workflow.value}>
                          {workflow.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Description" className="md:col-span-2">
                    <textarea
                      className={`${formTextareaClass} min-h-28`}
                      placeholder="Optional description of the job"
                      value={form.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                    />
                  </Field>
                  <Field label="Goal" className="md:col-span-2">
                    <textarea
                      className={`${formTextareaClass} min-h-40`}
                      placeholder="What should this job achieve?"
                      value={form.goal}
                      onChange={(e) => handleChange("goal", e.target.value)}
                    />
                  </Field>
                  <Field label="Semantic blueprint" className="md:col-span-2">
                    <textarea
                      className={`${formTextareaClass} min-h-40`}
                      placeholder="Describe the structure or reasoning shape"
                      value={form.semanticBlueprint}
                      onChange={(e) => handleChange("semanticBlueprint", e.target.value)}
                    />
                  </Field>
                  <Field label="Output template" className="md:col-span-2">
                    <textarea
                      className={`${formTextareaClass} min-h-40`}
                      placeholder="Describe the expected output format"
                      value={form.outputTemplate}
                      onChange={(e) => handleChange("outputTemplate", e.target.value)}
                    />
                  </Field>
                </div>
              ) : null}

                  {step === 1 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Stable instructions" className="md:col-span-2">
                    <textarea
                      className={`${formTextareaClass} min-h-48`}
                      placeholder="Enter the fixed instructions this job should always follow"
                      value={form.stableInstructions}
                      onChange={(e) => handleChange("stableInstructions", e.target.value)}
                    />
                  </Field>
                  <Field label="Role configuration" className="md:col-span-2">
                    <textarea
                      className={`${formTextareaClass} min-h-40`}
                      placeholder="Describe tone, role, or persona guidance"
                      value={form.roleConfiguration}
                      onChange={(e) => handleChange("roleConfiguration", e.target.value)}
                    />
                  </Field>
                  <Field label="Escalation policy">
                    <input
                      className={formInputClass}
                      placeholder="Enter escalation policy"
                      value={form.escalationPolicy}
                      onChange={(e) => handleChange("escalationPolicy", e.target.value)}
                    />
                  </Field>
                  <Field label="Execution mode" required>
                    <select className={formInputClass} value={form.executionMode} onChange={(e) => handleExecutionModeChange(e.target.value)}>
                      {EXECUTION_MODES.map((modeOption) => (
                        <option key={modeOption.value} value={modeOption.value}>
                          {modeOption.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-4">
                  <Field label={`Glossary terms (${glossaryTerms.length})`} className="space-y-4">
                    {glossaryAssets.length > 0 ? (
                      <select className={formInputClass} onChange={(e) => importGlossaryAsset(e.target.value)} value="">
                        <option value="">Import from glossary asset</option>
                        {glossaryAssets.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {getAssetLabel(asset)}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <div className="grid gap-3 md:grid-cols-3">
                      <input
                        className={formInputClass}
                        placeholder="Enter a term"
                        value={glossaryDraft.term}
                        onChange={(e) => setGlossaryDraft((current) => ({ ...current, term: e.target.value }))}
                      />
                      <input
                        className={formInputClass}
                        placeholder="Enter a definition"
                        value={glossaryDraft.definition}
                        onChange={(e) => setGlossaryDraft((current) => ({ ...current, definition: e.target.value }))}
                      />
                      <select
                        className={formInputClass}
                        value={glossaryDraft.category}
                        onChange={(e) => setGlossaryDraft((current) => ({ ...current, category: e.target.value }))}
                      >
                        {GLOSSARY_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                      onClick={addGlossaryTerm}
                      disabled={!glossaryDraft.term.trim()}
                    >
                      Add glossary term
                    </button>
                    <div className="space-y-2">
                      {glossaryTerms.map((term, index) => (
                        <div key={`${term.term}-${index}`} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{term.term}</p>
                            <p className="text-xs text-slate-500">{term.category}</p>
                            {term.definition ? <p className="mt-1 text-sm text-slate-600">{term.definition}</p> : null}
                          </div>
                          <button type="button" className="text-xs font-semibold text-rose-600" onClick={() => removeGlossaryTerm(index)}>
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </Field>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <Field label={`Relationships (${relationships.length})`} className="space-y-4">
                    {patternAssets.length > 0 ? (
                      <select className={formInputClass} onChange={(e) => importRelationshipPattern(e.target.value)} value="">
                        <option value="">Import from relationship pattern asset</option>
                        {patternAssets.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {getAssetLabel(asset)}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <div className="grid gap-3 md:grid-cols-3">
                      {glossaryTerms.length > 0 ? (
                        <select
                          className={formInputClass}
                          value={relationshipDraft.source}
                          onChange={(e) => setRelationshipDraft((current) => ({ ...current, source: e.target.value }))}
                        >
                          <option value="">Select source term</option>
                          {glossaryTerms.map((term) => (
                            <option key={term.term} value={term.term}>
                              {term.term}
                            </option>
                          ))}
                          <option value="__custom__">Custom term</option>
                        </select>
                      ) : (
                        <input
                          className={formInputClass}
                          placeholder="Enter a source term"
                          value={relationshipDraft.source}
                          onChange={(e) => setRelationshipDraft((current) => ({ ...current, source: e.target.value }))}
                        />
                      )}
                      <select
                        className={formInputClass}
                        value={relationshipDraft.relation}
                        onChange={(e) => setRelationshipDraft((current) => ({ ...current, relation: e.target.value }))}
                      >
                        {RELATIONSHIP_TYPES.map((relation) => (
                          <option key={relation} value={relation}>
                            {relation}
                          </option>
                        ))}
                      </select>
                      {glossaryTerms.length > 0 ? (
                        <select
                          className={formInputClass}
                          value={relationshipDraft.target}
                          onChange={(e) => setRelationshipDraft((current) => ({ ...current, target: e.target.value }))}
                        >
                          <option value="">Select target term</option>
                          {glossaryTerms.map((term) => (
                            <option key={term.term} value={term.term}>
                              {term.term}
                            </option>
                          ))}
                          <option value="__custom__">Custom term</option>
                        </select>
                      ) : (
                        <input
                          className={formInputClass}
                          placeholder="Enter a target term"
                          value={relationshipDraft.target}
                          onChange={(e) => setRelationshipDraft((current) => ({ ...current, target: e.target.value }))}
                        />
                      )}
                    </div>
                    {(relationshipDraft.source === "__custom__" || relationshipDraft.target === "__custom__") ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {relationshipDraft.source === "__custom__" ? (
                            <input
                              className={formInputClass}
                              placeholder="Enter a custom source term"
                              value={relationshipDraft.source}
                              onChange={(e) => setRelationshipDraft((current) => ({ ...current, source: e.target.value }))}
                            />
                        ) : null}
                        {relationshipDraft.target === "__custom__" ? (
                            <input
                              className={formInputClass}
                              placeholder="Enter a custom target term"
                              value={relationshipDraft.target}
                              onChange={(e) => setRelationshipDraft((current) => ({ ...current, target: e.target.value }))}
                            />
                        ) : null}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                      onClick={addRelationship}
                      disabled={!relationshipDraft.source.trim() || !relationshipDraft.target.trim() || relationshipDraft.source === "__custom__" || relationshipDraft.target === "__custom__"}
                    >
                      Add relationship
                    </button>
                    <div className="space-y-2">
                      {relationships.map((relationship, index) => (
                        <div key={`${relationship.source}-${relationship.target}-${index}`} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {relationship.source} <span className="text-slate-400">[{relationship.relation}]</span> {relationship.target}
                            </p>
                          </div>
                          <button type="button" className="text-xs font-semibold text-rose-600" onClick={() => removeRelationship(index)}>
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </Field>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Retrieval mode" required>
                    <select className={formInputClass} value={form.retrievalMode} onChange={(e) => handleRetrievalModeChange(e.target.value)}>
                      {RETRIEVAL_MODES.map((modeOption) => (
                        <option key={modeOption.value} value={modeOption.value}>
                          {modeOption.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Vector connection" required={form.retrievalMode === "external"}>
                    <select
                      className={formInputClass}
                      value={form.vectorConnectionId}
                      onChange={(e) => handleVectorConnectionChange(e.target.value)}
                      disabled={form.retrievalMode !== "external"}
                    >
                      <option value="">{form.retrievalMode === "external" ? "Select a connection" : "Not required for Jet KB"}</option>
                      {vectorConnections.map((connection) => (
                        <option key={connection.id} value={connection.id}>
                          {getVectorConnectionLabel(connection)}
                        </option>
                      ))}
                    </select>
                    {form.retrievalMode === "external" ? (
                      <p className="mt-2 text-xs text-slate-500">
                        {isLoadingVectorConnections ? "Loading vector connections..." : "Choose the friendly connection name; the app stores the ID for you."}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">Jet KB is the default. Switch to External only when you need a vector connection.</p>
                    )}
                  </Field>
                  <div className="md:col-span-2">
                    <Link
                      href="/context-jobs/vector-connections"
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
                    >
                      Manage connections
                    </Link>
                  </div>
                  <Field label={`Trusted sources (${trustedSources.length})`} className="md:col-span-2 space-y-4">
                    {sourceProfileAssets.length > 0 ? (
                      <select className={formInputClass} onChange={(e) => importTrustedSourceAsset(e.target.value)} value="">
                        <option value="">Import from source profile asset</option>
                        {sourceProfileAssets.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {getAssetLabel(asset)}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <div className="grid gap-3 md:grid-cols-3">
                        <input
                          className={formInputClass}
                          placeholder="Enter a source name"
                          value={trustedSourceDraft.name}
                          onChange={(e) => setTrustedSourceDraft((current) => ({ ...current, name: e.target.value }))}
                        />
                        <input
                          className={formInputClass}
                          placeholder="Enter a URL"
                          value={trustedSourceDraft.url}
                          onChange={(e) => setTrustedSourceDraft((current) => ({ ...current, url: e.target.value }))}
                        />
                      <select
                        className={formInputClass}
                        value={trustedSourceDraft.kind}
                        onChange={(e) => setTrustedSourceDraft((current) => ({ ...current, kind: e.target.value }))}
                      >
                        {SOURCE_KINDS.map((kind) => (
                          <option key={kind} value={kind}>
                            {kind}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                      onClick={addTrustedSource}
                      disabled={!trustedSourceDraft.name.trim()}
                    >
                      Add trusted source
                    </button>
                    <div className="space-y-2">
                      {trustedSources.map((source, index) => (
                        <div key={`${source.name}-${index}`} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{source.name}</p>
                            <p className="text-xs text-slate-500">{source.kind}</p>
                            {source.url ? <p className="mt-1 text-sm text-slate-600">{source.url}</p> : null}
                          </div>
                          <button type="button" className="text-xs font-semibold text-rose-600" onClick={() => removeTrustedSource(index)}>
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </Field>
                  <Field label={`Linked assets (${form.assetIds.length})`} className="md:col-span-2">
                    <select className={formInputClass} onChange={(e) => handleAssetSelection(e.target.value)} value="">
                      <option value="">{isLoadingAssets ? "Loading assets..." : "Select an asset to link"}</option>
                      {linkedAssetOptions.map((asset) => (
                        <option key={asset.id} value={asset.id} disabled={form.assetIds.includes(asset.id)}>
                          {getAssetLabel(asset)}
                        </option>
                      ))}
                    </select>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {form.assetIds.map((assetId) => {
                        const asset = linkedAssetOptions.find((item) => item.id === assetId);
                        return (
                          <button
                            key={assetId}
                            type="button"
                            onClick={() => removeAssetSelection(assetId)}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                          >
                            {asset ? getAssetLabel(asset) : assetId} ×
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  <Field label="Retrieval config" className="md:col-span-2 space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={Boolean(retrievalConfig.queryRewriting)}
                          onChange={(e) => updateRetrievalConfig({ queryRewriting: e.target.checked })}
                        />
                        <span className="text-sm text-slate-700">Query rewriting</span>
                      </label>
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={Boolean(retrievalConfig.hybridRetrieval)}
                          onChange={(e) => updateRetrievalConfig({ hybridRetrieval: e.target.checked })}
                        />
                        <span className="text-sm text-slate-700">Hybrid retrieval</span>
                      </label>
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={Boolean(retrievalConfig.reranking)}
                          onChange={(e) => updateRetrievalConfig({ reranking: e.target.checked })}
                        />
                        <span className="text-sm text-slate-700">Reranking</span>
                      </label>
                      <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <span className="mb-2 block text-sm text-slate-700">Max documents</span>
                        <input
                          type="number"
                          className={formInputClass}
                          value={Number(retrievalConfig.maxDocuments ?? 10)}
                          onChange={(e) => updateRetrievalConfig({ maxDocuments: Number(e.target.value) || 0 })}
                        />
                      </label>
                    </div>
                  </Field>
                </div>
              ) : null}

              {step === 5 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Approval required" className="md:col-span-2">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" checked={form.approvalRequired} onChange={(e) => handleChange("approvalRequired", e.target.checked)} />
                      <span className="text-sm text-slate-700">Require human approval for this job</span>
                    </label>
                  </Field>
                  <Field label="Policy profile">
                    <input
                      className={formInputClass}
                      placeholder="Enter a policy profile"
                      value={form.policyProfile}
                      onChange={(e) => handleChange("policyProfile", e.target.value)}
                    />
                  </Field>
                  <Field label="Memory config" className="md:col-span-2 space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={memoryConfig.sessionMemory !== false}
                          onChange={(e) => updateMemoryConfig({ sessionMemory: e.target.checked })}
                        />
                        <span className="text-sm text-slate-700">Session memory</span>
                      </label>
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={Boolean(memoryConfig.projectMemory)}
                          onChange={(e) => updateMemoryConfig({ projectMemory: e.target.checked })}
                        />
                        <span className="text-sm text-slate-700">Project memory</span>
                      </label>
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={Boolean(memoryConfig.userProfileMemory)}
                          onChange={(e) => updateMemoryConfig({ userProfileMemory: e.target.checked })}
                        />
                        <span className="text-sm text-slate-700">User profile memory</span>
                      </label>
                      <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-3">
                        <span className="mb-2 block text-sm text-slate-700">Retention days</span>
                        <input
                          type="number"
                          className={formInputClass}
                          value={Number(memoryConfig.retentionDays ?? 30)}
                          onChange={(e) => updateMemoryConfig({ retentionDays: Number(e.target.value) || 0 })}
                        />
                      </label>
                    </div>
                  </Field>
                </div>
              ) : null}

              {step === 6 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Execution provider" required>
                    <select className={formInputClass} value={form.executionProvider} onChange={(e) => handleExecutionProviderChange(e.target.value)}>
                      {providerOptions.map((provider) => (
                        <option key={provider.value} value={provider.value}>
                          {provider.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {plan === "trial" ? (
                    <Field label="Execution model" required>
                      <input className={`${formInputClass} bg-slate-50`} value={selectedTrialModel} readOnly />
                    </Field>
                  ) : (
                    <Field label="Execution model" required>
                      <select className={formInputClass} value={form.executionModel} onChange={(e) => handleChange("executionModel", e.target.value)}>
                        <option value="">{isLoadingKeyModels ? "Loading models..." : form.llmKeyId ? "Select a model" : "Pick a key first"}</option>
                        {(keyModels.length ? keyModels : [{ id: form.executionModel || "", displayName: form.executionModel || "" }]).filter((model) => Boolean(model.id)).map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.displayName}
                          </option>
                        ))}
                      </select>
                      <p className="mt-2 text-xs text-slate-500">
                        {isLoadingKeyModels ? "Loading models for the selected key..." : form.llmKeyId ? "Choose a model for the selected API key." : "Pick a key first to load the matching models."}
                      </p>
                    </Field>
                  )}
                      {plan === "pro" ? (
                    <Field label="LLM key" required>
                      <select className={formInputClass} value={form.llmKeyId} onChange={(e) => handleLlmKeyChange(e.target.value)}>
                        <option value="">{isLoadingLlmKeys ? "Loading API keys..." : "Select an API key"}</option>
                        {llmKeys.map((key) => (
                          <option key={key.id} value={key.id}>
                            {getLlmKeyLabel(key)}
                          </option>
                        ))}
                      </select>
                      <p className="mt-2 text-xs text-slate-500">
                        {isLoadingLlmKeys
                          ? "Loading keys for the selected provider..."
                          : llmKeys.length
                          ? "Choose the friendly key label; the app keeps the ID hidden."
                          : "No saved API keys were found for this provider."}
                      </p>
                    </Field>
                  ) : null}
                  <Field label={`Tool permissions (${toolPermissions.length})`} className="md:col-span-2 space-y-4">
                    <p className="text-xs text-slate-500">
                      {isLoadingTools
                        ? "Loading allowed tools from the backend..."
                        : "Select one or more tools. The app stores the JSON objects the backend expects."}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {toolCatalog.map((permission) => {
                        const checked = toolPermissions.some((item) => item.toolId === permission.id);
                        return (
                          <label
                            key={permission.id}
                            className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                              checked ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-700"
                            }`}
                          >
                            <span className="text-sm font-medium">{permission.label}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleToolPermission(permission.id)}
                              className="h-4 w-4"
                            />
                          </label>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {toolPermissions.map((permission) => (
                        <button
                          key={permission.toolId}
                          type="button"
                          onClick={() => toggleToolPermission(permission.toolId)}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                        >
                          {toolPermissionLabel(permission.toolId, toolCatalog)} ×
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              ) : null}

              {step === 7 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={`Validation rules (${validationRules.length})`} className="md:col-span-2 space-y-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                      <input
                        className={formInputClass}
                        placeholder="Enter a rule name"
                        value={validationRuleDraft.name}
                        onChange={(e) => setValidationRuleDraft((current) => ({ ...current, name: e.target.value }))}
                      />
                      <select
                        className={formInputClass}
                        value={validationRuleDraft.type}
                        onChange={(e) => setValidationRuleDraft((current) => ({ ...current, type: e.target.value }))}
                      >
                        {VALIDATION_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <select
                        className={formInputClass}
                        value={validationRuleDraft.severity}
                        onChange={(e) => setValidationRuleDraft((current) => ({ ...current, severity: e.target.value }))}
                      >
                        {VALIDATION_SEVERITIES.map((severity) => (
                          <option key={severity} value={severity}>
                            {severity}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                      onClick={addValidationRule}
                      disabled={!validationRuleDraft.name.trim()}
                    >
                      Add validation rule
                    </button>
                    <div className="space-y-2">
                      {validationRules.map((rule, index) => (
                        <div key={`${rule.name}-${index}`} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{rule.name}</p>
                            <p className="text-xs text-slate-500">
                              {rule.type} · {rule.severity}
                            </p>
                          </div>
                          <button type="button" className="text-xs font-semibold text-rose-600" onClick={() => removeValidationRule(index)}>
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </Field>
                  <Field label="Budget settings" className="md:col-span-2">
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <span className="mb-2 block text-sm text-slate-700">Max tokens</span>
                        <input
                          type="number"
                          className={formInputClass}
                          value={Number(budgetSettings.maxTokens ?? 4096)}
                          onChange={(e) => updateBudgetSettings({ maxTokens: Number(e.target.value) || 0 })}
                        />
                      </label>
                      <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <span className="mb-2 block text-sm text-slate-700">Max latency ms</span>
                        <input
                          type="number"
                          className={formInputClass}
                          value={Number(budgetSettings.maxLatencyMs ?? 30000)}
                          onChange={(e) => updateBudgetSettings({ maxLatencyMs: Number(e.target.value) || 0 })}
                        />
                      </label>
                      <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <span className="mb-2 block text-sm text-slate-700">Max cost USD</span>
                        <input
                          type="number"
                          step="0.01"
                          className={formInputClass}
                          value={Number(budgetSettings.maxCostUsd ?? 0.5)}
                          onChange={(e) => updateBudgetSettings({ maxCostUsd: Number(e.target.value) || 0 })}
                        />
                      </label>
                    </div>
                  </Field>
                  <Field label="Max agent turns">
                    <input type="number" className={formInputClass} value={form.maxAgentTurns} onChange={(e) => handleChange("maxAgentTurns", Number(e.target.value) || 0)} />
                  </Field>
                </div>
              ) : null}

              {step === 8 ? (
                <div className="space-y-6">
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
                    {summary.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Status">
                      <select className={formInputClass} value={form.status} onChange={(e) => handleChange("status", e.target.value)}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </Field>
                    <Field label="Created/updated">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                          {mode === "edit" && job ? `Created ${formatDate(job.createdAt)} · Updated ${formatDate(job.updatedAt)}` : "This job will be created as a draft."}
                        </div>
                    </Field>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="sticky bottom-4 z-10 mt-8 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goToPreviousStep}
                disabled={isFirstStep}
                className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors ${
                  isFirstStep
                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Previous
              </button>

              <div className="flex items-center gap-3">
                <p className="hidden text-xs font-medium uppercase tracking-[0.2em] text-slate-500 sm:block">
                  Step {step + 1} of {STEPS.length}
                </p>
                <button
                  type="button"
                  onClick={goToNextStep}
                  disabled={isLastStep}
                  className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors ${
                    isLastStep
                      ? "cursor-not-allowed bg-slate-100 text-slate-400"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </section>

          <aside className="min-w-0 space-y-4">
            <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Live Summary Map</p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {summary.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Quick actions</p>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaveDisabled}
                  className={`rounded-full px-5 py-3 text-sm font-semibold transition-colors ${
                    isSaveDisabled
                      ? "cursor-not-allowed bg-slate-200 text-slate-500"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {isSaving ? "Saving..." : mode === "edit" ? "Save changes" : "Create job"}
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-6">
              <p className="text-sm font-semibold text-slate-900">Builder notes</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This builder now covers the core slice 4 flow: create, edit, publish, and the live summary view used in the prototype.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block rounded-2xl border border-slate-200 bg-white p-4 ${className || ""}`.trim()}>
      <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </span>
      {children}
    </label>
  );
}

export default function ContextJobBuilder({ mode, jobId }: { mode: BuilderMode; jobId?: string }) {
  return (
    <AuthGuard>
      <BuilderContent mode={mode} jobId={jobId} />
    </AuthGuard>
  );
}
