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
}

export interface ContextJobsToolKeyCreateRequest {
  toolId: string;
  provider: string;
  keyLabel: string;
  apiKey: string;
}

export interface ContextJobAsset {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  content?: Record<string, unknown> | string | null;
  status?: string | null;
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

export const getContextJobsLlmKeys = async (provider?: string): Promise<ContextJobsLlmKey[]> => {
  try {
    const params = new URLSearchParams();
    if (provider) {
      params.set("provider", provider);
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
): Promise<ContextJobIngestionUploadResponse> => {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

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

export const instantiateContextJobTemplate = async (templateId: string): Promise<Record<string, unknown>> => {
  try {
    const response = await apiClient.post<Record<string, unknown>>(`/context-jobs/templates/${templateId}/instantiate`);
    return response.data;
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "instantiateContextJobTemplate");
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

export const getContextJobsAssets = async (): Promise<ContextJobAsset[]> => {
  try {
    const response = await apiClient.get<unknown>("/context-jobs/assets");
    return normalizeListResponse<ContextJobAsset>(response.data);
  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, "getContextJobsAssets");
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
    const response = await apiClient.get<ContextJobRun>(`/context-jobs/runs/${runId}`);
    return response.data;
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

export const getContextJobRunChain = async (runId: string): Promise<Record<string, unknown>> => {
  try {
    const response = await apiClient.get<Record<string, unknown>>(`/context-jobs/runs/${runId}/chain`);
    return response.data;
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

export const startContextJobRun = async (jobId: string, userRequest: string): Promise<ContextJobRunStartResponse> => {
  try {
    const response = await apiClient.post<ContextJobRunStartResponse>(`/context-jobs/jobs/${jobId}/run`, {
      userRequest,
    });
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
