import apiClient from "./client";
import { normalizeError, logError } from "@/shared/utils/errorHandler";

export interface ContextJobsProviderModel {
  id: string;
  displayName: string;
}

export interface ContextJobsProvider {
  provider: string;
  displayName: string;
  models: ContextJobsProviderModel[];
  hasUserKey: boolean;
  selectable: boolean;
}

export interface ContextJobsLlmKey {
  id: string;
  provider?: string | null;
  keyPurpose?: string | null;
  keyLabel?: string | null;
  label?: string | null;
  name?: string | null;
  status?: string | null;
  keyLastFour?: string | null;
  isPlatformKey?: boolean | null;
  lastVerifiedAt?: string | null;
  lastError?: string | null;
  usageCount?: number | null;
  createdAt?: string | null;
}

export interface ContextJobsToolKey {
  id: string;
  toolId?: string | null;
  provider?: string | null;
  keyLabel?: string | null;
  label?: string | null;
  name?: string | null;
  status?: string | null;
  keyLastFour?: string | null;
  lastVerifiedAt?: string | null;
  lastError?: string | null;
  usageCount?: number | null;
  createdAt?: string | null;
}

export interface ContextJobsVectorConnection {
  id: string;
  owner?: string | null;
  name?: string | null;
  displayName?: string | null;
  provider?: string | null;
  status?: string | null;
  lastTestedAt?: string | null;
  lastError?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ContextJobsVectorConnectionEmbeddingModel {
  modelId: string;
  provider: string;
  defaultDimensions?: number | null;
}

export interface ContextJobsVectorConnectionCreateRequest {
  name: string;
  provider: string;
  config: Record<string, unknown>;
  status?: string;
}

export interface ContextJobsVectorConnectionUpdateRequest {
  name?: string;
  provider?: string;
  config?: Record<string, unknown>;
  status?: string;
}

export interface ContextJobsVectorConnectionTestResponse {
  ok?: boolean;
  provider?: string | null;
  message?: string | null;
}

export interface ContextJobsClmConnection {
  id: string;
  owner?: string | null;
  name?: string | null;
  provider?: string | null;
  status?: string | null;
  lastTestedAt?: string | null;
  lastError?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ContextJobsClmConnectionCreateRequest {
  name: string;
  provider: "coupa" | "ironclad" | string;
  config: Record<string, unknown>;
  status?: string;
}

export interface ContextJobsClmConnectionUpdateRequest {
  name?: string;
  config?: Record<string, unknown>;
  status?: string;
}

export interface ContextJobsClmConnectionTestResponse {
  ok?: boolean;
  provider?: string | null;
  message?: string | null;
}

export interface ContextJobsClmImportRequest {
  connectionId: string;
  url?: string;
  resourceId?: string;
  metadata?: Record<string, string>;
}

export interface ContextJobsClmImportResult {
  provider?: string;
  resourceType?: string;
  resourceId?: string;
  filename?: string;
  jobId?: string;
  ingestionStatus?: string;
  upsertedCount?: number;
  warnings?: string[];
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface ContextJobsTool {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  isReadOnly?: boolean | null;
  externalProvider?: string | null;
  hasUserKey?: boolean | null;
}

export interface ContextJobsLlmKeyCreateRequest {
  provider: string;
  keyLabel: string;
  apiKey: string;
  keyPurpose?: "llm" | "embedding" | "both";
}

export interface ContextJobsToolKeyCreateRequest {
  toolId: string;
  provider: string;
  keyLabel: string;
  apiKey: string;
}

export const CONTEXT_JOB_ASSET_TYPES = [
  "policy",
  "retrieval_profile",
  "validation_contract",
  "memory_policy",
  "style_guide",
  "tool_profile",
  "glossary",
  "source_profile",
  "relationship_pattern",
] as const;

export type ContextJobAssetType = (typeof CONTEXT_JOB_ASSET_TYPES)[number];

export interface ContextJobAsset {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  content?: Record<string, unknown> | string | null;
  version?: number | null;
  status?: string | null;
  owner?: string | null;
  workspaceId?: string | null;
  approvalStatus?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ContextJobAssetCreateRequest {
  name: string;
  type: string;
  description?: string | null;
  content?: Record<string, unknown> | null;
  version?: number;
  status?: string;
  approvalStatus?: string;
}

export type ContextJobAssetUpdateRequest = Partial<ContextJobAssetCreateRequest>;

export interface ContextJobsProcurementAlert {
  id: string;
  owner?: string | null;
  workspaceId?: string | null;
  vendor?: string | null;
  contractDocumentId: string;
  expiryDate: string;
  complexityTier: string;
  leadMonthsThreshold: number;
  complexityTierDefaulted: boolean;
  description?: string | null;
  alertedAt: string;
  dismissed: boolean;
  suggestedJobId?: string | null;
}

export interface ContextJobsRunArtifact {
  path: string;
  filename?: string | null;
  sizeBytes?: number | null;
  mimeType?: string | null;
  toolId?: string | null;
  purpose?: string | null;
}

export interface ContextJobsRunArtifacts {
  runId: string;
  artifacts: ContextJobsRunArtifact[];
}

export interface ContextJobsRunChainNode {
  runId: string;
  jobId: string;
  jobName?: string | null;
  status: string;
  createdAt?: string | null;
  childRuns?: ContextJobsRunChainNode[];
}

export interface ContextJobsRunChain {
  runId: string;
  parentRunId?: string | null;
  parentRun?: ContextJobsRunChainNode | null;
  childRuns: ContextJobsRunChainNode[];
}

export interface ContextJobsLimits {
  maxJobs: number;
  maxRuns: number;
}

export interface ContextJobsUsage {
  jobs: number;
  runs: number;
}

export interface ContextJobsEntitlements {
  userId: string;
  plan: string | null;
  contextJobsEnabled: boolean;
  message: string | null;
  upgradeRequired: string | null;
  keyMode: string | null;
  canManageKeys?: boolean | null;
  limits: ContextJobsLimits | null;
  usage: ContextJobsUsage | null;
  canCreateJob: boolean;
  canCreateRun: boolean;
  providers: ContextJobsProvider[];
}

export interface ContextJob {
  id: string;
  name: string;
  description: string | null;
  status: string;
  goal: string | null;
  semanticBlueprint: string | null;
  outputTemplate: string | null;
  workflowType: string;
  stableInstructions: string | null;
  roleConfiguration: string | null;
  retrievalConfig: Record<string, unknown> | null;
  retrievalMode: string;
  vectorConnectionId: string | null;
  memoryConfig: Record<string, unknown> | null;
  toolPermissions: unknown[] | null;
  validationRules: unknown[] | null;
  escalationPolicy: string | null;
  budgetSettings: Record<string, unknown> | null;
  glossaryTerms: unknown[] | null;
  relationships: unknown[] | null;
  trustedSources: unknown[] | null;
  chainConfig: Record<string, unknown> | null;
  linkedChildJobId: string | null;
  version: number;
  approvalRequired: boolean;
  policyProfile: string | null;
  owner?: string | null;
  executionProvider: string;
  executionModel: string;
  llmKeyId: string | null;
  maxAgentTurns: number;
  executionMode: string;
  workspaceId: string | null;
  assetIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContextJobsStats {
  jobCount: number;
  runCount: number;
  assetCount: number;
  passRate: number;
}

export interface ContextJobStats {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  completionRate: number;
  warningRate: number;
  reviewEscalationRate: number;
  averageRuntimeSeconds: number;
  averageCost: number;
  recentFailures: { runId: string; state: string; startedAt: string; endedAt: string | null }[];
  recentRuns: { runId: string; state: string; startedAt: string; endedAt: string | null; outcome: string | null }[];
  topValidationFailures: { message: string; count: number }[];
}

export interface ContextJobsRunQueueStatus {
  active_runs: number;
  queued_runs: number;
  queue_capacity: number;
  workers: number;
}

export interface ContextJobsRunPrimaryResult {
  resultType?: string | null;
  title?: string | null;
  content?: string | null;
}

export interface ContextJobsRunOutputPackage {
  status?: string | null;
  primaryResult?: ContextJobsRunPrimaryResult | null;
  validationSummary?: {
    overallDecision?: string | null;
    confidenceLevel?: string | null;
    repairReason?: string | null;
    checks?: Array<Record<string, unknown>>;
  } | null;
  nextAction?: {
    type?: string | null;
    label?: string | null;
  } | null;
  costTimeSummary?: {
    runtimeSeconds?: number | null;
    estimatedCost?: string | number | null;
  } | null;
  auditMetadata?: Record<string, unknown> | null;
}

export interface ContextJobRun {
  id: string;
  jobId: string;
  state: string;
  userRequest: string | null;
  startedAt: string;
  endedAt: string | null;
  stepLogs: unknown[] | null;
  retrievalEvents: unknown[] | null;
  toolEvents: unknown[] | null;
  validationEvents: unknown[] | null;
  sourceTraceEvents: unknown[] | null;
  runOutputPackage: ContextJobsRunOutputPackage | null;
  humanDecision: Record<string, unknown> | null;
  outcome: string | null;
  outputText: string | null;
  jobVersion: number | null;
  tokenUsage: number | null;
  latencyMs: number | null;
  executionProvider: string | null;
  executionModel: string | null;
  totalProviderTokens: number | null;
  totalToolCalls: number | null;
  estimatedCostUsd: number | null;
  agentTurns: number | null;
  pendingApprovals: unknown[] | null;
  pendingMemoryChanges: Record<string, unknown> | null;
  repairCycles: number | null;
  parentRunId: string | null;
  amendmentRunId?: string | null;
  amendmentState?: string | null;
  amendmentValidation?: {
    passed: boolean;
    errors: string[];
    warnings: string[];
  } | null;
  amendmentSourceStatus?: "found" | "not_found" | null;
  workspaceId: string | null;
  job?: ContextJob | null;
}

export interface ContextJobsPendingToolApproval {
  id: string;
  toolId?: string | null;
  toolName?: string | null;
  reason?: string | null;
  status?: string | null;
  requestedAt?: string | null;
}

export interface ContextJobsToolApprovalRequest {
  decision: "approved" | "approve" | "denied" | "deny";
  notes?: string;
}

export interface ContextJobsMemoryConfirmRequest {
  approved: boolean;
}

export interface ContextJobRunStartResponse {
  id: string;
  [key: string]: unknown;
}

export interface ContextJobMutationPayload {
  name: string;
  [key: string]: unknown;
}

export type ContextJobPatchPayload = Partial<ContextJobMutationPayload>;

export interface JobLifecycleRequest {
  notes?: string;
}

export interface ContextJobRollbackRequest {
  version: number;
  notes?: string;
}

export interface ContextJobVersion {
  id: string;
  jobId: string;
  version: number;
  createdAt: string;
  createdBy?: string | null;
  changeType?: string | null;
  isCurrent?: boolean | null;
  rollbackFromVersion?: number | null;
  notes?: string | null;
  jobSnapshot?: Record<string, unknown> | null;
}

export interface ContextJobPublishHistoryItem {
  id: string;
  jobId: string;
  fromStatus: string;
  toStatus: string;
  changedBy?: string | null;
  changedAt: string;
  notes?: string | null;
}

export interface ContextJobIngestionDocument {
  text: string;
  metadata?: Record<string, unknown> | string;
  id?: string;
}

export interface ContextJobIngestionRequest {
  documents: ContextJobIngestionDocument[];
  ingestionConfig?: Record<string, unknown>;
}

export interface ContextJobIngestionResponse {
  status?: string | null;
  outcome?: string | null;
  nextAction?: {
    type?: string | null;
    label?: string | null;
  } | null;
  upsertedCount?: number | null;
  failedCount?: number | null;
  validationEvents?: Array<Record<string, unknown>> | null;
  warnings?: string[] | null;
  exceptions?: Array<Record<string, unknown>> | null;
  error?: string | null;
  ingestedSources?: Array<{
    documentName?: string | null;
    chunkCount?: number | null;
  }> | null;
  jobId?: string | null;
  vectorConnectionId?: string | null;
}

export interface ContextJobIngestionUploadSkippedItem {
  documentName?: string | null;
  reason?: string | null;
}

export interface ContextJobIngestionUploadResponse extends ContextJobIngestionResponse {
  skipped?: ContextJobIngestionUploadSkippedItem[] | null;
}

export interface ContextJobFromPromptRequest {
  prompt: string;
  agentType?: string;
}

export const getContextJobsEntitlements = async (): Promise<ContextJobsEntitlements> => {
  try {
    const response = await apiClient.get<ContextJobsEntitlements>("/context-jobs/entitlements");
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobsEntitlements");
    throw normalizedError;
  }
};

function normalizeListResponse<T>(responseData: unknown): T[] {
  if (Array.isArray(responseData)) {
    return responseData as T[];
  }

  if (responseData && typeof responseData === "object") {
    const record = responseData as { items?: T[]; data?: T[]; results?: T[] };
    return record.items ?? record.data ?? record.results ?? [];
  }

  return [];
}

function normalizeContextJob(job: unknown): ContextJob {
  if (!job || typeof job !== "object" || Array.isArray(job)) {
    return job as ContextJob;
  }

  const record = job as Record<string, unknown>;
  const rawAssetIds =
    (Array.isArray(record.assetIds) && record.assetIds) ||
    (Array.isArray(record.asset_ids) && record.asset_ids) ||
    (Array.isArray(record.linkedAssetIds) && record.linkedAssetIds) ||
    (Array.isArray(record.linked_asset_ids) && record.linked_asset_ids) ||
    [];

  return {
    ...(record as unknown as ContextJob),
    createdAt:
      (typeof record.createdAt === "string" && record.createdAt) ||
      (typeof record.created_at === "string" && record.created_at) ||
      "",
    updatedAt:
      (typeof record.updatedAt === "string" && record.updatedAt) ||
      (typeof record.updated_at === "string" && record.updated_at) ||
      "",
    linkedChildJobId:
      (typeof record.linkedChildJobId === "string" && record.linkedChildJobId) ||
      (typeof record.linked_child_job_id === "string" && record.linked_child_job_id) ||
      null,
    assetIds: rawAssetIds
      .map((item) => String(item || "").trim())
      .filter(Boolean),
  };
}

export const getContextJobs = async (): Promise<ContextJob[]> => {
  try {
    const response = await apiClient.get<ContextJob[]>("/context-jobs/jobs");
    return normalizeListResponse<ContextJob>(response.data).map(normalizeContextJob);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobs");
    throw normalizedError;
  }
};

export const getContextJob = async (jobId: string): Promise<ContextJob> => {
  try {
    const response = await apiClient.get<ContextJob>(`/context-jobs/jobs/${jobId}`);
    return normalizeContextJob(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJob");
    throw normalizedError;
  }
};

export interface ContextJobPendingHandoff {
  parentRunId: string;
  childJobId: string;
  suggestedUserRequest: string;
  label?: string | null;
  status: string;
}

export const getContextJobPendingHandoff = async (
  jobId: string,
  parentRunId?: string | null
): Promise<ContextJobPendingHandoff | null> => {
  try {
    const params = parentRunId ? `?parentRunId=${encodeURIComponent(parentRunId)}` : "";
    const response = await apiClient.get<ContextJobPendingHandoff>(
      `/context-jobs/jobs/${jobId}/pending-handoff${params}`
    );
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    if (normalizedError.statusCode === 404) {
      return null;
    }
    logError(normalizedError, "getContextJobPendingHandoff");
    throw normalizedError;
  }
};

export const getContextJobsLlmKeys = async (
  provider?: string,
  purpose?: "llm" | "embedding" | "both",
): Promise<ContextJobsLlmKey[]> => {
  try {
    const params = new URLSearchParams();
    if (provider) {
      params.set("provider", provider);
    }
    if (purpose) {
      params.set("purpose", purpose);
    }

    const response = await apiClient.get<unknown>(
      params.toString() ? `/context-jobs/llm-keys?${params.toString()}` : "/context-jobs/llm-keys"
    );
    return normalizeListResponse<ContextJobsLlmKey>(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobsLlmKeys");
    throw normalizedError;
  }
};

export const getContextJobVersions = async (jobId: string): Promise<ContextJobVersion[]> => {
  try {
    const response = await apiClient.get<unknown>(`/context-jobs/jobs/${jobId}/versions`);
    return normalizeListResponse<ContextJobVersion>(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobVersions");
    throw normalizedError;
  }
};

export const getContextJobPublishHistory = async (jobId: string): Promise<ContextJobPublishHistoryItem[]> => {
  try {
    const response = await apiClient.get<unknown>(`/context-jobs/jobs/${jobId}/publish-history`);
    return normalizeListResponse<ContextJobPublishHistoryItem>(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobPublishHistory");
    throw normalizedError;
  }
};

export const ingestContextJob = async (
  jobId: string,
  request: ContextJobIngestionRequest,
): Promise<ContextJobIngestionResponse> => {
  try {
    const response = await apiClient.post<ContextJobIngestionResponse>(`/context-jobs/jobs/${jobId}/ingest`, request, {
      timeout: 120000,
    });
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "ingestContextJob");
    throw normalizedError;
  }
};

export const ingestContextJobUpload = async (
  jobId: string,
  files: File[],
  metadata?: Record<string, string>,
): Promise<ContextJobIngestionUploadResponse> => {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    if (metadata && Object.keys(metadata).length > 0) {
      formData.append("metadataJson", JSON.stringify(metadata));
    }

    const response = await apiClient.post<ContextJobIngestionUploadResponse>(`/context-jobs/jobs/${jobId}/ingest/upload`, formData, {
      timeout: 120000,
    });
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "ingestContextJobUpload");
    throw normalizedError;
  }
};

export const getContextJobsTemplates = async (): Promise<ContextJob[]> => {
  try {
    const response = await apiClient.get<unknown>("/context-jobs/templates");
    return normalizeListResponse<ContextJob>(response.data).map(normalizeContextJob);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobsTemplates");
    throw normalizedError;
  }
};

export interface WorkflowCanvasApplyResult {
  name?: string;
  description?: string;
  goal?: string;
  stableInstructions?: string;
  roleConfiguration?: string;
  outputTemplate?: string;
  escalationPolicy?: string;
  appliedFields: string[];
}

export const downloadWorkflowCanvas = async (): Promise<Blob> => {
  try {
    const response = await apiClient.get<Blob>("/context-jobs/workflow-canvas/template", {
      responseType: "blob",
      timeout: 60000,
    });
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "downloadWorkflowCanvas");
    throw normalizedError;
  }
};

export const parseWorkflowCanvas = async (
  file: File,
  currentStableInstructions: string,
): Promise<WorkflowCanvasApplyResult> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("currentStableInstructions", currentStableInstructions);
    const response = await apiClient.post<WorkflowCanvasApplyResult>("/context-jobs/workflow-canvas/parse", formData, {
      timeout: 60000,
    });
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "parseWorkflowCanvas");
    throw normalizedError;
  }
};

export const instantiateContextJobTemplate = async (templateId: string): Promise<Record<string, unknown>> => {
  try {
    const response = await apiClient.post<Record<string, unknown>>(`/context-jobs/templates/${templateId}/instantiate`);
    const { refreshContextJobsEntitlements } = await import("@/shared/lib/refreshContextJobsEntitlements");
    void refreshContextJobsEntitlements();
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "instantiateContextJobTemplate");
    throw normalizedError;
  }
};

export type ProcurementDemoSetupResponse = {
  job: ContextJob;
  ingestion: {
    status: string;
    outcome: string;
    upsertedCount?: number;
    failedCount?: number;
    warnings?: string[];
    error?: string | null;
    ingestedSources?: Array<Record<string, unknown>>;
  };
};

export const setupProcurementDemo = async (payload: {
  templateId: string;
}): Promise<ProcurementDemoSetupResponse> => {
  try {
    const response = await apiClient.post<Record<string, unknown>>(
      "/context-jobs/procurement/demo-setup",
      {
        templateId: payload.templateId,
      },
      { timeout: 180000 },
    );
    const data = response.data ?? {};
    const ingestionRaw = (data.ingestion ?? {}) as Record<string, unknown>;
    const { refreshContextJobsEntitlements } = await import("@/shared/lib/refreshContextJobsEntitlements");
    void refreshContextJobsEntitlements();
    return {
      job: normalizeContextJob(data.job),
      ingestion: {
        status: String(ingestionRaw.status ?? ""),
        outcome: String(ingestionRaw.outcome ?? ""),
        upsertedCount: Number(ingestionRaw.upsertedCount ?? ingestionRaw.upserted_count ?? 0),
        failedCount: Number(ingestionRaw.failedCount ?? ingestionRaw.failed_count ?? 0),
        warnings: Array.isArray(ingestionRaw.warnings) ? (ingestionRaw.warnings as string[]) : [],
        error: (ingestionRaw.error as string | null | undefined) ?? null,
        ingestedSources: Array.isArray(ingestionRaw.ingestedSources)
          ? (ingestionRaw.ingestedSources as Array<Record<string, unknown>>)
          : Array.isArray(ingestionRaw.ingested_sources)
            ? (ingestionRaw.ingested_sources as Array<Record<string, unknown>>)
            : [],
      },
    };
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "setupProcurementDemo");
    throw normalizedError;
  }
};

export const createContextJobFromPrompt = async (
  request: ContextJobFromPromptRequest,
): Promise<Record<string, unknown>> => {
  try {
    const response = await apiClient.post<Record<string, unknown>>("/context-jobs/jobs/from-prompt", request);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "createContextJobFromPrompt");
    throw normalizedError;
  }
};

export const createContextJobsLlmKey = async (payload: ContextJobsLlmKeyCreateRequest): Promise<ContextJobsLlmKey> => {
  try {
    const response = await apiClient.post<ContextJobsLlmKey>("/context-jobs/llm-keys", payload);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "createContextJobsLlmKey");
    throw normalizedError;
  }
};

export const verifyContextJobsLlmKey = async (keyId: string): Promise<ContextJobsLlmKey> => {
  try {
    const response = await apiClient.post<ContextJobsLlmKey>(`/context-jobs/llm-keys/${keyId}/verify`);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "verifyContextJobsLlmKey");
    throw normalizedError;
  }
};

export const deleteContextJobsLlmKey = async (keyId: string): Promise<void> => {
  try {
    await apiClient.delete(`/context-jobs/llm-keys/${keyId}`);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "deleteContextJobsLlmKey");
    throw normalizedError;
  }
};

export const getContextJobsLlmKeyModels = async (keyId: string): Promise<ContextJobsProviderModel[]> => {
  try {
    const response = await apiClient.get<unknown>(`/context-jobs/llm-keys/${keyId}/models`);
    if (response.data && typeof response.data === "object" && !Array.isArray(response.data)) {
      const record = response.data as { models?: ContextJobsProviderModel[] };
      if (Array.isArray(record.models)) {
        return record.models;
      }
    }

    return normalizeListResponse<ContextJobsProviderModel>(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobsLlmKeyModels");
    throw normalizedError;
  }
};

export const getContextJobsVectorConnections = async (): Promise<ContextJobsVectorConnection[]> => {
  try {
    const response = await apiClient.get<unknown>("/context-jobs/vector-connections");
    return normalizeListResponse<ContextJobsVectorConnection>(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobsVectorConnections");
    throw normalizedError;
  }
};

function normalizeContextJobAsset(asset: unknown): ContextJobAsset {
  if (!asset || typeof asset !== "object" || Array.isArray(asset)) {
    return asset as ContextJobAsset;
  }

  const record = asset as Record<string, unknown>;
  return {
    ...(record as unknown as ContextJobAsset),
    workspaceId:
      (typeof record.workspaceId === "string" && record.workspaceId) ||
      (typeof record.workspace_id === "string" && record.workspace_id) ||
      null,
    approvalStatus:
      (typeof record.approvalStatus === "string" && record.approvalStatus) ||
      (typeof record.approval_status === "string" && record.approval_status) ||
      null,
    createdAt:
      (typeof record.createdAt === "string" && record.createdAt) ||
      (typeof record.created_at === "string" && record.created_at) ||
      null,
    updatedAt:
      (typeof record.updatedAt === "string" && record.updatedAt) ||
      (typeof record.updated_at === "string" && record.updated_at) ||
      null,
  };
}

export const getContextJobsAssets = async (): Promise<ContextJobAsset[]> => {
  try {
    const response = await apiClient.get<unknown>("/context-jobs/assets");
    return normalizeListResponse<ContextJobAsset>(response.data).map(normalizeContextJobAsset);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobsAssets");
    throw normalizedError;
  }
};

export const createContextJobsAsset = async (
  payload: ContextJobAssetCreateRequest,
): Promise<ContextJobAsset> => {
  try {
    const response = await apiClient.post<ContextJobAsset>("/context-jobs/assets", payload);
    return normalizeContextJobAsset(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "createContextJobsAsset");
    throw normalizedError;
  }
};

export const updateContextJobsAsset = async (
  assetId: string,
  payload: ContextJobAssetUpdateRequest,
): Promise<ContextJobAsset> => {
  try {
    const response = await apiClient.patch<ContextJobAsset>(`/context-jobs/assets/${assetId}`, payload);
    return normalizeContextJobAsset(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "updateContextJobsAsset");
    throw normalizedError;
  }
};

export const deleteContextJobsAsset = async (assetId: string): Promise<void> => {
  try {
    await apiClient.delete(`/context-jobs/assets/${assetId}`);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "deleteContextJobsAsset");
    throw normalizedError;
  }
};

function normalizeProcurementAlert(alert: unknown): ContextJobsProcurementAlert {
  if (!alert || typeof alert !== "object" || Array.isArray(alert)) {
    return alert as ContextJobsProcurementAlert;
  }

  const record = alert as Record<string, unknown>;
  return {
    ...(record as unknown as ContextJobsProcurementAlert),
    workspaceId:
      (typeof record.workspaceId === "string" && record.workspaceId) ||
      (typeof record.workspace_id === "string" && record.workspace_id) ||
      null,
    contractDocumentId:
      (typeof record.contractDocumentId === "string" && record.contractDocumentId) ||
      (typeof record.contract_document_id === "string" && record.contract_document_id) ||
      "",
    expiryDate:
      (typeof record.expiryDate === "string" && record.expiryDate) ||
      (typeof record.expiry_date === "string" && record.expiry_date) ||
      "",
    complexityTier:
      (typeof record.complexityTier === "string" && record.complexityTier) ||
      (typeof record.complexity_tier === "string" && record.complexity_tier) ||
      "",
    leadMonthsThreshold:
      (typeof record.leadMonthsThreshold === "number" && record.leadMonthsThreshold) ||
      (typeof record.lead_months_threshold === "number" && record.lead_months_threshold) ||
      0,
    complexityTierDefaulted: Boolean(
      record.complexityTierDefaulted ?? record.complexity_tier_defaulted ?? false,
    ),
    description:
      (typeof record.description === "string" && record.description) || null,
    alertedAt:
      (typeof record.alertedAt === "string" && record.alertedAt) ||
      (typeof record.alerted_at === "string" && record.alerted_at) ||
      "",
    suggestedJobId:
      (typeof record.suggestedJobId === "string" && record.suggestedJobId) ||
      (typeof record.suggested_job_id === "string" && record.suggested_job_id) ||
      null,
  };
}

export type ProcurementContractRegisterResponse = {
  contractDocumentId: string;
  expiryDate: string;
  vendor?: string | null;
  description?: string | null;
  complexityTier: string;
  namespace: string;
  ingestionStatus: string;
  upsertedCount: number;
  warnings: string[];
  message: string;
};

export const registerProcurementAlertContract = async (payload: {
  file?: File | null;
  contractText?: string;
  expiryDate: string;
  description: string;
  vendor?: string;
  contractId?: string;
  complexityTier?: string;
}): Promise<ProcurementContractRegisterResponse> => {
  try {
    const form = new FormData();
    form.append("expiryDate", payload.expiryDate);
    form.append("description", payload.description);
    if (payload.vendor?.trim()) form.append("vendor", payload.vendor.trim());
    if (payload.contractId?.trim()) form.append("contractId", payload.contractId.trim());
    if (payload.complexityTier?.trim()) form.append("complexityTier", payload.complexityTier.trim());
    if (payload.contractText?.trim()) form.append("contractText", payload.contractText.trim());
    if (payload.file) form.append("file", payload.file);

    const response = await apiClient.post<Record<string, unknown>>(
      "/context-jobs/procurement/alerts/register-contract",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    const data = response.data || {};
    return {
      contractDocumentId: String(data.contractDocumentId ?? data.contract_document_id ?? ""),
      expiryDate: String(data.expiryDate ?? data.expiry_date ?? ""),
      vendor: (data.vendor as string | null | undefined) ?? null,
      description: (data.description as string | null | undefined) ?? null,
      complexityTier: String(data.complexityTier ?? data.complexity_tier ?? "medium"),
      namespace: String(data.namespace ?? ""),
      ingestionStatus: String(data.ingestionStatus ?? data.ingestion_status ?? ""),
      upsertedCount: Number(data.upsertedCount ?? data.upserted_count ?? 0),
      warnings: Array.isArray(data.warnings) ? (data.warnings as string[]) : [],
      message: String(data.message ?? ""),
    };
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "registerProcurementAlertContract");
    throw normalizedError;
  }
};

export const getContextJobsProcurementAlerts = async (): Promise<ContextJobsProcurementAlert[]> => {
  try {
    const response = await apiClient.get<unknown>("/context-jobs/procurement/alerts");
    return normalizeListResponse<ContextJobsProcurementAlert>(response.data).map(normalizeProcurementAlert);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobsProcurementAlerts");
    throw normalizedError;
  }
};

export const dismissContextJobsProcurementAlert = async (
  alertId: string,
): Promise<ContextJobsProcurementAlert> => {
  try {
    const response = await apiClient.post<ContextJobsProcurementAlert>(
      `/context-jobs/procurement/alerts/${alertId}/dismiss`,
    );
    return normalizeProcurementAlert(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "dismissContextJobsProcurementAlert");
    throw normalizedError;
  }
};

function normalizeRunArtifact(artifact: unknown): ContextJobsRunArtifact {
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
    return artifact as ContextJobsRunArtifact;
  }

  const record = artifact as Record<string, unknown>;
  return {
    path: typeof record.path === "string" ? record.path : "",
    filename:
      (typeof record.filename === "string" && record.filename) ||
      null,
    sizeBytes:
      (typeof record.sizeBytes === "number" && record.sizeBytes) ||
      (typeof record.size_bytes === "number" && record.size_bytes) ||
      null,
    mimeType:
      (typeof record.mimeType === "string" && record.mimeType) ||
      (typeof record.mime_type === "string" && record.mime_type) ||
      null,
    toolId:
      (typeof record.toolId === "string" && record.toolId) ||
      (typeof record.tool_id === "string" && record.tool_id) ||
      null,
    purpose:
      (typeof record.purpose === "string" && record.purpose) ||
      null,
  };
}

export const getContextJobRunArtifacts = async (runId: string): Promise<ContextJobsRunArtifacts> => {
  try {
    const response = await apiClient.get<Record<string, unknown>>(`/context-jobs/runs/${runId}/artifacts`);
    const data = response.data ?? {};
    const artifactsRaw = Array.isArray(data.artifacts) ? data.artifacts : [];
    return {
      runId:
        (typeof data.runId === "string" && data.runId) ||
        (typeof data.run_id === "string" && data.run_id) ||
        runId,
      artifacts: artifactsRaw.map(normalizeRunArtifact).filter((item) => item.path),
    };
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobRunArtifacts");
    throw normalizedError;
  }
};

export const downloadContextJobRunArtifact = async (
  runId: string,
  artifactPath: string,
): Promise<Blob> => {
  try {
    const encodedPath = artifactPath
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    const response = await apiClient.get<Blob>(
      `/context-jobs/runs/${runId}/artifacts/${encodedPath}`,
      { responseType: "blob" },
    );
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "downloadContextJobRunArtifact");
    throw normalizedError;
  }
};

export const getContextJobsTools = async (): Promise<ContextJobsTool[]> => {
  try {
    const response = await apiClient.get<unknown>("/context-jobs/tools");
    return normalizeListResponse<ContextJobsTool>(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobsTools");
    throw normalizedError;
  }
};

export const getContextJobsToolKeys = async (): Promise<ContextJobsToolKey[]> => {
  try {
    const response = await apiClient.get<unknown>("/context-jobs/tool-keys");
    return normalizeListResponse<ContextJobsToolKey>(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobsToolKeys");
    throw normalizedError;
  }
};

export const getContextJobsVectorConnectionEmbeddingModels = async (): Promise<ContextJobsVectorConnectionEmbeddingModel[]> => {
  try {
    const response = await apiClient.get<unknown>("/context-jobs/vector-connections/embedding-models");
    return normalizeListResponse<ContextJobsVectorConnectionEmbeddingModel>(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobsVectorConnectionEmbeddingModels");
    throw normalizedError;
  }
};

export const createContextJobsVectorConnection = async (
  payload: ContextJobsVectorConnectionCreateRequest,
): Promise<ContextJobsVectorConnection> => {
  try {
    const response = await apiClient.post<ContextJobsVectorConnection>("/context-jobs/vector-connections", payload);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "createContextJobsVectorConnection");
    throw normalizedError;
  }
};

export const updateContextJobsVectorConnection = async (
  connectionId: string,
  payload: ContextJobsVectorConnectionUpdateRequest,
): Promise<ContextJobsVectorConnection> => {
  try {
    const response = await apiClient.patch<ContextJobsVectorConnection>(`/context-jobs/vector-connections/${connectionId}`, payload);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "updateContextJobsVectorConnection");
    throw normalizedError;
  }
};

export const testContextJobsVectorConnection = async (
  connectionId: string,
): Promise<ContextJobsVectorConnectionTestResponse> => {
  try {
    const response = await apiClient.post<ContextJobsVectorConnectionTestResponse>(`/context-jobs/vector-connections/${connectionId}/test`);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "testContextJobsVectorConnection");
    throw normalizedError;
  }
};

export const deleteContextJobsVectorConnection = async (connectionId: string): Promise<void> => {
  try {
    await apiClient.delete(`/context-jobs/vector-connections/${connectionId}`);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "deleteContextJobsVectorConnection");
    throw normalizedError;
  }
};

function normalizeClmConnection(connection: unknown): ContextJobsClmConnection {
  if (!connection || typeof connection !== "object" || Array.isArray(connection)) {
    return connection as ContextJobsClmConnection;
  }

  const record = connection as Record<string, unknown>;
  return {
    id: String(record.id ?? ""),
    owner: typeof record.owner === "string" ? record.owner : null,
    name: typeof record.name === "string" ? record.name : null,
    provider: typeof record.provider === "string" ? record.provider : null,
    status: typeof record.status === "string" ? record.status : null,
    lastTestedAt:
      (typeof record.lastTestedAt === "string" && record.lastTestedAt) ||
      (typeof record.last_tested_at === "string" && record.last_tested_at) ||
      null,
    lastError:
      (typeof record.lastError === "string" && record.lastError) ||
      (typeof record.last_error === "string" && record.last_error) ||
      null,
    createdAt:
      (typeof record.createdAt === "string" && record.createdAt) ||
      (typeof record.created_at === "string" && record.created_at) ||
      null,
    updatedAt:
      (typeof record.updatedAt === "string" && record.updatedAt) ||
      (typeof record.updated_at === "string" && record.updated_at) ||
      null,
  };
}

export const getContextJobsClmConnections = async (): Promise<ContextJobsClmConnection[]> => {
  try {
    const response = await apiClient.get<unknown>("/context-jobs/clm-connections");
    return normalizeListResponse<ContextJobsClmConnection>(response.data).map(normalizeClmConnection);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobsClmConnections");
    throw normalizedError;
  }
};

export const createContextJobsClmConnection = async (
  payload: ContextJobsClmConnectionCreateRequest,
): Promise<ContextJobsClmConnection> => {
  try {
    const response = await apiClient.post<ContextJobsClmConnection>("/context-jobs/clm-connections", payload);
    return normalizeClmConnection(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "createContextJobsClmConnection");
    throw normalizedError;
  }
};

export const updateContextJobsClmConnection = async (
  connectionId: string,
  payload: ContextJobsClmConnectionUpdateRequest,
): Promise<ContextJobsClmConnection> => {
  try {
    const response = await apiClient.patch<ContextJobsClmConnection>(
      `/context-jobs/clm-connections/${connectionId}`,
      payload,
    );
    return normalizeClmConnection(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "updateContextJobsClmConnection");
    throw normalizedError;
  }
};

export const testContextJobsClmConnection = async (
  connectionId: string,
): Promise<ContextJobsClmConnectionTestResponse> => {
  try {
    const response = await apiClient.post<ContextJobsClmConnectionTestResponse>(
      `/context-jobs/clm-connections/${connectionId}/test`,
    );
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "testContextJobsClmConnection");
    throw normalizedError;
  }
};

export const deleteContextJobsClmConnection = async (connectionId: string): Promise<void> => {
  try {
    await apiClient.delete(`/context-jobs/clm-connections/${connectionId}`);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "deleteContextJobsClmConnection");
    throw normalizedError;
  }
};

export const ingestContextJobFromClm = async (
  jobId: string,
  payload: ContextJobsClmImportRequest,
): Promise<ContextJobsClmImportResult> => {
  try {
    const response = await apiClient.post<Record<string, unknown>>(
      `/context-jobs/jobs/${jobId}/ingest/clm`,
      payload,
      { timeout: 180000 },
    );
    const data = response.data || {};
    return {
      provider: typeof data.provider === "string" ? data.provider : undefined,
      resourceType:
        (typeof data.resourceType === "string" && data.resourceType) ||
        (typeof data.resource_type === "string" && data.resource_type) ||
        undefined,
      resourceId:
        (typeof data.resourceId === "string" && data.resourceId) ||
        (typeof data.resource_id === "string" && data.resource_id) ||
        undefined,
      filename: typeof data.filename === "string" ? data.filename : undefined,
      jobId:
        (typeof data.jobId === "string" && data.jobId) ||
        (typeof data.job_id === "string" && data.job_id) ||
        undefined,
      ingestionStatus:
        (typeof data.ingestionStatus === "string" && data.ingestionStatus) ||
        (typeof data.ingestion_status === "string" && data.ingestion_status) ||
        undefined,
      upsertedCount:
        typeof data.upsertedCount === "number"
          ? data.upsertedCount
          : typeof data.upserted_count === "number"
            ? data.upserted_count
            : undefined,
      warnings: Array.isArray(data.warnings) ? (data.warnings as string[]) : [],
      message: typeof data.message === "string" ? data.message : undefined,
      metadata:
        data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
          ? (data.metadata as Record<string, unknown>)
          : undefined,
    };
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "ingestContextJobFromClm");
    throw normalizedError;
  }
};

export const createContextJobsToolKey = async (payload: ContextJobsToolKeyCreateRequest): Promise<ContextJobsToolKey> => {
  try {
    const response = await apiClient.post<ContextJobsToolKey>("/context-jobs/tool-keys", payload);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "createContextJobsToolKey");
    throw normalizedError;
  }
};

export const deleteContextJobsToolKey = async (keyId: string): Promise<void> => {
  try {
    await apiClient.delete(`/context-jobs/tool-keys/${keyId}`);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "deleteContextJobsToolKey");
    throw normalizedError;
  }
};

export const createContextJob = async (payload: ContextJobMutationPayload): Promise<ContextJob> => {
  try {
    const response = await apiClient.post<ContextJob>("/context-jobs/jobs", payload);
    const { refreshContextJobsEntitlements } = await import("@/shared/lib/refreshContextJobsEntitlements");
    void refreshContextJobsEntitlements();
    return normalizeContextJob(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "createContextJob");
    throw normalizedError;
  }
};

export const updateContextJob = async (jobId: string, payload: ContextJobPatchPayload): Promise<ContextJob> => {
  try {
    const response = await apiClient.patch<ContextJob>(`/context-jobs/jobs/${jobId}`, payload);
    return normalizeContextJob(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "updateContextJob");
    throw normalizedError;
  }
};

export const getContextJobsStats = async (): Promise<ContextJobsStats> => {
  try {
    const response = await apiClient.get<ContextJobsStats>("/context-jobs/stats");
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobsStats");
    throw normalizedError;
  }
};

export const getContextJobStats = async (jobId: string): Promise<ContextJobStats> => {
  try {
    const response = await apiClient.get<ContextJobStats>(`/context-jobs/jobs/${jobId}/stats`);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobStats");
    throw normalizedError;
  }
};

export const getContextJobsRuns = async (): Promise<ContextJobRun[]> => {
  try {
    const response = await apiClient.get<unknown>("/context-jobs/runs");
    return normalizeListResponse<ContextJobRun>(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobsRuns");
    throw normalizedError;
  }
};

export const getContextJobsRunQueueStatus = async (): Promise<ContextJobsRunQueueStatus> => {
  try {
    const response = await apiClient.get<ContextJobsRunQueueStatus>("/context-jobs/runs/queue-status");
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobsRunQueueStatus");
    throw normalizedError;
  }
};

export const getContextJobRun = async (runId: string): Promise<ContextJobRun> => {
  try {
    const response = await apiClient.get<ContextJobRun & Record<string, unknown>>(
      `/context-jobs/runs/${runId}`,
    );
    const data = response.data;
    const record = data as unknown as Record<string, unknown>;
    const rawValidation =
      data.amendmentValidation ??
      (record.amendment_validation as ContextJobRun["amendmentValidation"] | undefined) ??
      null;
    const rawSourceStatus =
      data.amendmentSourceStatus ??
      (record.amendment_source_status as ContextJobRun["amendmentSourceStatus"] | undefined) ??
      null;

    return {
      ...data,
      amendmentRunId:
        data.amendmentRunId ||
        (typeof record.amendment_run_id === "string" ? record.amendment_run_id : null),
      amendmentState:
        data.amendmentState ||
        (typeof record.amendment_state === "string" ? record.amendment_state : null),
      amendmentValidation: rawValidation,
      amendmentSourceStatus: rawSourceStatus,
      humanDecision:
        data.humanDecision ||
        (record.human_decision && typeof record.human_decision === "object"
          ? (record.human_decision as Record<string, unknown>)
          : data.humanDecision),
    };
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobRun");
    throw normalizedError;
  }
};

export const getContextJobRunPendingApprovals = async (runId: string): Promise<ContextJobsPendingToolApproval[]> => {
  try {
    const response = await apiClient.get<unknown>(`/context-jobs/runs/${runId}/pending-approvals`);
    return normalizeListResponse<ContextJobsPendingToolApproval>(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobRunPendingApprovals");
    throw normalizedError;
  }
};

export const submitContextJobToolApproval = async (
  runId: string,
  approvalId: string,
  request: ContextJobsToolApprovalRequest,
): Promise<ContextJobRun> => {
  try {
    const response = await apiClient.post<ContextJobRun>(
      `/context-jobs/runs/${runId}/tool-approvals/${approvalId}`,
      request,
    );
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "submitContextJobToolApproval");
    throw normalizedError;
  }
};

export const confirmContextJobMemoryChanges = async (
  runId: string,
  approved: boolean,
): Promise<ContextJobRun> => {
  try {
    const response = await apiClient.post<ContextJobRun>(`/context-jobs/runs/${runId}/memory-confirm`, {
      approved,
    } satisfies ContextJobsMemoryConfirmRequest);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "confirmContextJobMemoryChanges");
    throw normalizedError;
  }
};

function normalizeRunChainNode(node: unknown): ContextJobsRunChainNode {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return {
      runId: "",
      jobId: "",
      status: "unknown",
      childRuns: [],
    };
  }

  const record = node as Record<string, unknown>;
  const childRaw = Array.isArray(record.childRuns)
    ? record.childRuns
    : Array.isArray(record.child_runs)
      ? record.child_runs
      : [];

  return {
    runId:
      (typeof record.runId === "string" && record.runId) ||
      (typeof record.run_id === "string" && record.run_id) ||
      "",
    jobId:
      (typeof record.jobId === "string" && record.jobId) ||
      (typeof record.job_id === "string" && record.job_id) ||
      "",
    jobName:
      (typeof record.jobName === "string" && record.jobName) ||
      (typeof record.job_name === "string" && record.job_name) ||
      null,
    status: typeof record.status === "string" ? record.status : "unknown",
    createdAt:
      (typeof record.createdAt === "string" && record.createdAt) ||
      (typeof record.created_at === "string" && record.created_at) ||
      null,
    childRuns: childRaw.map(normalizeRunChainNode),
  };
}

export const getContextJobRunChain = async (runId: string): Promise<ContextJobsRunChain> => {
  try {
    const response = await apiClient.get<Record<string, unknown>>(`/context-jobs/runs/${runId}/chain`);
    const data = response.data ?? {};
    const childRaw = Array.isArray(data.childRuns)
      ? data.childRuns
      : Array.isArray(data.child_runs)
        ? data.child_runs
        : [];

    return {
      runId:
        (typeof data.runId === "string" && data.runId) ||
        (typeof data.run_id === "string" && data.run_id) ||
        runId,
      parentRunId:
        (typeof data.parentRunId === "string" && data.parentRunId) ||
        (typeof data.parent_run_id === "string" && data.parent_run_id) ||
        null,
      parentRun: data.parentRun || data.parent_run
        ? normalizeRunChainNode(data.parentRun ?? data.parent_run)
        : null,
      childRuns: childRaw.map(normalizeRunChainNode),
    };
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobRunChain");
    throw normalizedError;
  }
};

export const duplicateContextJob = async (jobId: string): Promise<ContextJob> => {
  try {
    const response = await apiClient.post<ContextJob>(`/context-jobs/jobs/${jobId}/duplicate`);
    return normalizeContextJob(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "duplicateContextJob");
    throw normalizedError;
  }
};

export const archiveContextJob = async (jobId: string, request?: JobLifecycleRequest): Promise<ContextJob> => {
  try {
    const response = await apiClient.post<ContextJob>(`/context-jobs/jobs/${jobId}/archive`, request ?? undefined);
    return normalizeContextJob(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "archiveContextJob");
    throw normalizedError;
  }
};

export const publishContextJob = async (jobId: string, request?: JobLifecycleRequest): Promise<ContextJob> => {
  try {
    const response = await apiClient.post<ContextJob>(`/context-jobs/jobs/${jobId}/publish`, request ?? undefined);
    return normalizeContextJob(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "publishContextJob");
    throw normalizedError;
  }
};

export const startContextJobRun = async (
  jobId: string,
  userRequest: string,
  options?: { parentRunId?: string | null }
): Promise<ContextJobRunStartResponse> => {
  try {
    const response = await apiClient.post<ContextJobRunStartResponse>(`/context-jobs/jobs/${jobId}/run`, {
      userRequest,
      ...(options?.parentRunId ? { parentRunId: options.parentRunId } : {}),
    });
    const { refreshContextJobsEntitlements } = await import("@/shared/lib/refreshContextJobsEntitlements");
    void refreshContextJobsEntitlements();
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "startContextJobRun");
    throw normalizedError;
  }
};

export const rollbackContextJob = async (jobId: string, request: ContextJobRollbackRequest): Promise<ContextJob> => {
  try {
    const response = await apiClient.post<ContextJob>(`/context-jobs/jobs/${jobId}/rollback`, request);
    return normalizeContextJob(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "rollbackContextJob");
    throw normalizedError;
  }
};

export const replayContextJobRun = async (runId: string): Promise<ContextJobRun> => {
  try {
    const response = await apiClient.post<ContextJobRun>(`/context-jobs/runs/${runId}/replay`);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "replayContextJobRun");
    throw normalizedError;
  }
};

export const recordContextJobRunDecision = async (
  runId: string,
  payload: { decision: string; notes?: string },
): Promise<ContextJobRun> => {
  try {
    const response = await apiClient.patch<ContextJobRun>(`/context-jobs/runs/${runId}/decision`, payload);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "recordContextJobRunDecision");
    throw normalizedError;
  }
};

export const attachContractToRun = async (
  runId: string,
  payload: { contractText: string },
): Promise<ContextJobRun> => {
  try {
    const response = await apiClient.post<ContextJobRun>(
      `/context-jobs/runs/${runId}/attach-contract`,
      payload,
    );
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "attachContractToRun");
    throw normalizedError;
  }
};

export const retryAmendment = async (
  runId: string,
): Promise<ContextJobRun> => {
  try {
    const response = await apiClient.post<ContextJobRun>(
      `/context-jobs/runs/${runId}/retry-amendment`,
    );
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "retryAmendment");
    throw normalizedError;
  }
};
