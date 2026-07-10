"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AuthGuard from "@/shared/components/auth/AuthGuard";
import {
  createContextJobsVectorConnection,
  deleteContextJobsVectorConnection,
  getContextJobsVectorConnectionEmbeddingModels,
  getContextJobsVectorConnections,
  testContextJobsVectorConnection,
  updateContextJobsVectorConnection,
  type ContextJobsVectorConnection,
  type ContextJobsVectorConnectionEmbeddingModel,
} from "@/shared/api/contextJobs";
import { useContextJobsEntitlements } from "@/shared/hooks/useContextJobsEntitlements";

type VectorConnectionProvider = "pinecone" | "qdrant" | "weaviate" | "pgvector";

type VectorConnectionFormState = {
  name: string;
  provider: VectorConnectionProvider;
  status: string;
  apiKey: string;
  indexName: string;
  url: string;
  collectionName: string;
  className: string;
  databaseUrl: string;
  tableName: string;
  embeddingApiKey: string;
};

const DEFAULT_FORM_STATE: VectorConnectionFormState = {
  name: "",
  provider: "pinecone",
  status: "active",
  apiKey: "",
  indexName: "",
  url: "",
  collectionName: "",
  className: "",
  databaseUrl: "",
  tableName: "",
  embeddingApiKey: "",
};

const PROVIDER_HINTS: Record<VectorConnectionProvider, string> = {
  pinecone: "Index-based hosted vector storage. Add your Pinecone API key and index name.",
  qdrant: "Qdrant cluster or cloud endpoint. Add the URL and collection name.",
  weaviate: "Weaviate cluster. Add the endpoint and class/index configuration.",
  pgvector: "Postgres with pgvector. Add the database URL and table or schema details.",
};

const PROVIDER_LABELS: Record<VectorConnectionProvider, string> = {
  pinecone: "Pinecone",
  qdrant: "Qdrant",
  weaviate: "Weaviate",
  pgvector: "pgvector",
};

function formatMaybeDate(value: string | null | undefined): string {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatErrorMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Something went wrong.";
}

function isVectorConnectionProvider(value: string): value is VectorConnectionProvider {
  return value === "pinecone" || value === "qdrant" || value === "weaviate" || value === "pgvector";
}

function createEmptyConnectionForm(provider: VectorConnectionProvider): VectorConnectionFormState {
  return {
    ...DEFAULT_FORM_STATE,
    provider,
    apiKey: "",
    indexName: "",
    url: "",
    collectionName: "",
    className: "",
    databaseUrl: "",
    tableName: "",
    embeddingApiKey: "",
  };
}

function getDefaultEmbeddingSelection(models: ContextJobsVectorConnectionEmbeddingModel[]): {
  provider: string;
  modelId: string;
} {
  const preferred = models.find((model) => model.provider === "openai" && model.modelId === "text-embedding-3-small")
    ?? models.find((model) => model.provider === "openai")
    ?? models[0];
  const provider = preferred?.provider ?? "openai";
  const modelId = preferred?.modelId ?? "text-embedding-3-small";
  return { provider, modelId };
}

function buildConfigPayload(
  form: VectorConnectionFormState,
  embeddingProvider: string,
  embeddingModel: string,
): Record<string, unknown> | null {
  const base = {
    embedding_provider: embeddingProvider,
    embedding_model: embeddingModel,
    ...(form.embeddingApiKey.trim() ? { embedding_api_key: form.embeddingApiKey.trim() } : {}),
  };

  if (form.provider === "pinecone") {
    return {
      ...base,
      api_key: form.apiKey.trim(),
      index_name: form.indexName.trim(),
    };
  }

  if (form.provider === "qdrant") {
    return {
      ...base,
      url: form.url.trim(),
      collection_name: form.collectionName.trim(),
    };
  }

  if (form.provider === "weaviate") {
    return {
      ...base,
      url: form.url.trim(),
      class_name: form.className.trim(),
    };
  }

  if (form.provider === "pgvector") {
    return {
      ...base,
      database_url: form.databaseUrl.trim(),
      table_name: form.tableName.trim(),
    };
  }

  return null;
}

function hasRequiredConfigFields(form: VectorConnectionFormState, embeddingProvider: string, embeddingModel: string): boolean {
  if (!embeddingProvider.trim() || !embeddingModel.trim()) return false;

  if (embeddingProvider !== "openai" && !form.embeddingApiKey.trim()) return false;

  if (form.provider === "pinecone") {
    return Boolean(form.apiKey.trim() && form.indexName.trim());
  }

  if (form.provider === "qdrant") {
    return Boolean(form.url.trim() && form.collectionName.trim());
  }

  if (form.provider === "weaviate") {
    return Boolean(form.url.trim() && form.className.trim());
  }

  if (form.provider === "pgvector") {
    return Boolean(form.databaseUrl.trim() && form.tableName.trim());
  }

  return false;
}

function hasAnyConfigInput(form: VectorConnectionFormState): boolean {
  return Boolean(
    form.apiKey.trim() ||
      form.indexName.trim() ||
      form.url.trim() ||
      form.collectionName.trim() ||
      form.className.trim() ||
      form.databaseUrl.trim() ||
      form.tableName.trim() ||
      form.embeddingApiKey.trim(),
  );
}

export default function VectorConnectionsPage() {
  const entitlements = useContextJobsEntitlements();
  const [connections, setConnections] = useState<ContextJobsVectorConnection[]>([]);
  const [embeddingModels, setEmbeddingModels] = useState<ContextJobsVectorConnectionEmbeddingModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<VectorConnectionFormState>(DEFAULT_FORM_STATE);
  const [embeddingProvider, setEmbeddingProvider] = useState("openai");
  const [embeddingModel, setEmbeddingModel] = useState("text-embedding-3-small");
  const initialEmbeddingProviderRef = useRef(embeddingProvider);
  const initialEmbeddingModelRef = useRef(embeddingModel);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const [connectionData, modelData] = await Promise.all([
        getContextJobsVectorConnections(),
        getContextJobsVectorConnectionEmbeddingModels(),
      ]);
      setConnections(connectionData);
      setEmbeddingModels(modelData);
      const defaults = getDefaultEmbeddingSelection(modelData);
      setEmbeddingProvider(defaults.provider);
      setEmbeddingModel(defaults.modelId);
      initialEmbeddingProviderRef.current = defaults.provider;
      initialEmbeddingModelRef.current = defaults.modelId;
      setSelectedId((current) => current ?? connectionData[0]?.id ?? null);
      if (!connectionData.length) {
        setForm(createEmptyConnectionForm(DEFAULT_FORM_STATE.provider));
      }
    } catch (err) {
      setError(formatErrorMessage(err));
      setConnections([]);
      setEmbeddingModels([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedConnection = useMemo(
    () => connections.find((connection) => connection.id === selectedId) ?? null,
    [connections, selectedId],
  );

  useEffect(() => {
    if (!selectedConnection) {
      return;
    }

    setForm({
      name: selectedConnection.name || "",
      provider: isVectorConnectionProvider(selectedConnection.provider || DEFAULT_FORM_STATE.provider)
        ? selectedConnection.provider || DEFAULT_FORM_STATE.provider
        : DEFAULT_FORM_STATE.provider,
      status: selectedConnection.status || "active",
      apiKey: "",
      indexName: "",
      url: "",
      collectionName: "",
      className: "",
      databaseUrl: "",
      tableName: "",
      embeddingApiKey: "",
    });
  }, [selectedConnection]);

  const startNew = (): void => {
    setSelectedId(null);
    setForm(createEmptyConnectionForm(DEFAULT_FORM_STATE.provider));
    setMessage(null);
    setError(null);
  };

  const selectConnection = (connection: ContextJobsVectorConnection): void => {
    setSelectedId(connection.id);
    setMessage(null);
    setError(null);
  };

  const handleSave = async (): Promise<void> => {
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!form.provider.trim()) {
      setError("Provider is required.");
      return;
    }

    const shouldIncludeConfig = !selectedId || hasAnyConfigInput(form);

    if (shouldIncludeConfig && !hasRequiredConfigFields(form, embeddingProvider, embeddingModel)) {
      setError("Fill in the required connection fields before saving.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setMessage(null);

      const payload = {
        name: form.name.trim(),
        provider: form.provider.trim(),
        status: form.status.trim() || "active",
      };
      const config = shouldIncludeConfig ? buildConfigPayload(form, embeddingProvider, embeddingModel) : null;

      if (selectedId) {
        const updatePayload = {
          ...payload,
          ...(config ? { config } : {}),
        };
        const updated = await updateContextJobsVectorConnection(selectedId, updatePayload);
        setConnections((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setSelectedId(updated.id);
        setMessage(`Updated ${updated.name || "vector connection"}.`);
      } else {
        if (!config) {
          throw new Error("Connection config is required when creating a new connection.");
        }

        const created = await createContextJobsVectorConnection({
          ...payload,
          config,
        });
        setConnections((current) => [created, ...current.filter((item) => item.id !== created.id)]);
        setSelectedId(created.id);
        setMessage(`Created ${created.name || "vector connection"}.`);
      }
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async (connectionId: string): Promise<void> => {
    try {
      setTestingId(connectionId);
      setError(null);
      setMessage(null);
      const result = await testContextJobsVectorConnection(connectionId);
      setMessage(result.message || "Connection test completed.");
      await loadData();
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (connectionId: string): Promise<void> => {
    const connection = connections.find((item) => item.id === connectionId);
    const label = connection?.name || "this connection";
    if (!window.confirm(`Delete ${label}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(connectionId);
      setError(null);
      setMessage(null);
      await deleteContextJobsVectorConnection(connectionId);
      await loadData();
      if (selectedId === connectionId) {
        startNew();
      }
      setMessage(`Deleted ${label}.`);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const embeddingProviders = useMemo(() => {
    const providers = Array.from(new Set(embeddingModels.map((model) => model.provider))).filter(Boolean);
    return providers.length ? providers : ["openai", "mistral", "jina", "cohere", "voyage", "google"];
  }, [embeddingModels]);

  const modelsForProvider = useMemo(
    () => embeddingModels.filter((model) => model.provider === embeddingProvider),
    [embeddingModels, embeddingProvider],
  );

  const isPinecone = form.provider === "pinecone";
  const isQdrant = form.provider === "qdrant";
  const isWeaviate = form.provider === "weaviate";
  const isPgvector = form.provider === "pgvector";
  const providerChanged = Boolean(selectedConnection && form.provider !== selectedConnection.provider);
  const embeddingChanged =
    embeddingProvider !== initialEmbeddingProviderRef.current || embeddingModel !== initialEmbeddingModelRef.current;
  const showConfigRequired = !selectedId || providerChanged || embeddingChanged;
  const shouldValidateConfig = !selectedId || hasAnyConfigInput(form) || providerChanged || embeddingChanged;
  const canSave =
    !isSaving &&
    Boolean(form.name.trim()) &&
    (!shouldValidateConfig || hasRequiredConfigFields(form, embeddingProvider, embeddingModel));

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_42%),linear-gradient(180deg,_#f7fcfc_0%,_#f4f8f8_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link href="/context-jobs/jobs" className="text-sm font-medium text-teal-700 hover:text-teal-900">
                Back to jobs
              </Link>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Vector DB connections
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Manage external retrieval targets for jobs that use <code>retrievalMode: "external"</code>.
              </p>
            </div>
            <button
              type="button"
              onClick={startNew}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              New connection
            </button>
          </div>

          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : null}

          {message ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <p className="text-sm font-medium">{message}</p>
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {selectedId ? "Edit connection" : "Create connection"}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">
                    {selectedId ? "Update the selected connection" : "Add a new vector connection"}
                  </h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {connections.length} saved
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Name <span className="text-rose-500">*</span>
                  </span>
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Production Pinecone KB"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Provider <span className="text-rose-500">*</span>
                  </span>
                  <select
                    value={form.provider}
                    onChange={(event) => {
                      const nextProvider = isVectorConnectionProvider(event.target.value) ? event.target.value : "pinecone";
                      setForm((current) => ({
                        ...current,
                        provider: nextProvider,
                        apiKey: "",
                        indexName: "",
                        url: "",
                        collectionName: "",
                        className: "",
                        databaseUrl: "",
                        tableName: "",
                      }));
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  >
                    {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Status</span>
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Connected by jobs</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {entitlements.status === "succeeded" && entitlements.canCreateJob ? "Eligible for job linking" : "Check your plan access"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Embedding provider <span className="text-rose-500">*</span>
                  </span>
                  <select
                    value={embeddingProvider}
                    onChange={(event) => {
                      const nextProvider = event.target.value;
                      const nextModels = embeddingModels.filter((model) => model.provider === nextProvider);
                      const nextModel = nextModels[0]?.modelId || "";
                      setEmbeddingProvider(nextProvider);
                      setEmbeddingModel(nextModel);
                      setMessage(`Selected embedding provider ${nextProvider}.`);
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  >
                    {embeddingProviders.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Embedding model <span className="text-rose-500">*</span>
                  </span>
                  <select
                    value={embeddingModel}
                    onChange={(event) => {
                      const nextModel = event.target.value;
                      setEmbeddingModel(nextModel);
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  >
                    {modelsForProvider.length ? (
                      modelsForProvider.map((model) => (
                        <option key={`${model.provider}-${model.modelId}`} value={model.modelId}>
                          {model.modelId}
                          {model.defaultDimensions ? ` (${model.defaultDimensions})` : ""}
                        </option>
                      ))
                    ) : (
                      <option value="">No models available</option>
                    )}
                  </select>
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {isPinecone ? (
                  <>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        API key {showConfigRequired ? <span className="text-rose-500">*</span> : null}
                      </span>
                      <input
                        value={form.apiKey}
                        onChange={(event) => setForm((current) => ({ ...current, apiKey: event.target.value }))}
                        placeholder="pc-..."
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Index name {showConfigRequired ? <span className="text-rose-500">*</span> : null}
                      </span>
                      <input
                        value={form.indexName}
                        onChange={(event) => setForm((current) => ({ ...current, indexName: event.target.value }))}
                        placeholder="jet-context"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      />
                    </label>
                  </>
                ) : null}

                {isQdrant ? (
                  <>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Qdrant URL {showConfigRequired ? <span className="text-rose-500">*</span> : null}
                      </span>
                      <input
                        value={form.url}
                        onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
                        placeholder="https://your-cluster.qdrant.tech"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Collection name {showConfigRequired ? <span className="text-rose-500">*</span> : null}
                      </span>
                      <input
                        value={form.collectionName}
                        onChange={(event) => setForm((current) => ({ ...current, collectionName: event.target.value }))}
                        placeholder="context-jobs"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      />
                    </label>
                  </>
                ) : null}

                {isWeaviate ? (
                  <>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Weaviate URL {showConfigRequired ? <span className="text-rose-500">*</span> : null}
                      </span>
                      <input
                        value={form.url}
                        onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
                        placeholder="https://your-cluster.weaviate.network"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Class name {showConfigRequired ? <span className="text-rose-500">*</span> : null}
                      </span>
                      <input
                        value={form.className}
                        onChange={(event) => setForm((current) => ({ ...current, className: event.target.value }))}
                        placeholder="ContextJobChunk"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      />
                    </label>
                  </>
                ) : null}

                {isPgvector ? (
                  <>
                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Database URL <span className="text-rose-500">*</span>
                      </span>
                      <input
                        value={form.databaseUrl}
                        onChange={(event) => setForm((current) => ({ ...current, databaseUrl: event.target.value }))}
                        placeholder="postgres://user:password@host:5432/database"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Table name <span className="text-rose-500">*</span>
                      </span>
                      <input
                        value={form.tableName}
                        onChange={(event) => setForm((current) => ({ ...current, tableName: event.target.value }))}
                        placeholder="context_job_embeddings"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      />
                    </label>
                  </>
                ) : null}

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Embedding API key
                    {embeddingProvider !== "openai" ? <span className="text-rose-500">*</span> : null}
                  </span>
                  <input
                    value={form.embeddingApiKey}
                    onChange={(event) => setForm((current) => ({ ...current, embeddingApiKey: event.target.value }))}
                    placeholder={embeddingProvider === "openai" ? "text-embedding-3-small" : "Required for this embedding provider"}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={!canSave}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : selectedId ? "Update connection" : "Create connection"}
                </button>
                {selectedId ? (
                  <button
                    type="button"
                    onClick={startNew}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Connections</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">Saved vector connections</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadData()}
                    disabled={isLoading}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Refresh
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {isLoading ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                      Loading vector connections...
                    </div>
                  ) : connections.length ? (
                    connections.map((connection) => (
                      <div
                        key={connection.id}
                        className={`rounded-2xl border px-4 py-4 ${selectedId === connection.id ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-slate-50"}`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">{connection.name || "Unnamed connection"}</p>
                              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                                {connection.provider || "unknown"}
                              </span>
                              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                                {connection.status || "active"}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              Updated {formatMaybeDate(connection.updatedAt)} {connection.lastTestedAt ? `- Tested ${formatMaybeDate(connection.lastTestedAt)}` : ""}
                            </p>
                            {connection.lastError ? (
                              <p className="mt-2 text-sm text-rose-700">{connection.lastError}</p>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void handleTest(connection.id)}
                              disabled={testingId === connection.id}
                              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {testingId === connection.id ? "Testing..." : "Test"}
                            </button>
                            <button
                              type="button"
                              onClick={() => selectConnection(connection)}
                              className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition-colors hover:bg-teal-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(connection.id)}
                              disabled={deletingId === connection.id}
                              className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId === connection.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                      No vector connections saved yet.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Helpful note</p>
                  <p className="mt-1 leading-6">
                    {PROVIDER_HINTS[form.provider] || "Add the provider-specific URL, keys, and indexing details the backend needs."}
                  </p>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
