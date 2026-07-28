"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import AuthGuard from "@/shared/components/auth/AuthGuard";
import {
  CONTEXT_JOB_ASSET_TYPES,
  createContextJobsAsset,
  deleteContextJobsAsset,
  getContextJobsAssets,
  updateContextJobsAsset,
  type ContextJobAsset,
  type ContextJobAssetType,
} from "@/shared/api/contextJobs";
import { useContextJobsEntitlements } from "@/shared/hooks/useContextJobsEntitlements";

const ASSET_TYPE_LABELS: Record<ContextJobAssetType, string> = {
  policy: "Policy",
  retrieval_profile: "Retrieval profile",
  validation_contract: "Validation contract",
  memory_policy: "Memory policy",
  style_guide: "Style guide",
  tool_profile: "Tool profile",
  glossary: "Glossary",
  source_profile: "Source profile",
  relationship_pattern: "Relationship pattern",
};

const ASSET_TYPE_HINTS: Record<ContextJobAssetType, string> = {
  policy: "Policy text imported as a blocking validation rule.",
  retrieval_profile: "Default retrieval settings merged into jobs.",
  validation_contract: "Reusable validation rule sets.",
  memory_policy: "Session / project / retention defaults.",
  style_guide: "Tone and formatting guidance for role config.",
  tool_profile: "Tool permission presets for workflows.",
  glossary: "Shared terminology with definitions.",
  source_profile: "Trust and freshness defaults for sources.",
  relationship_pattern: "Entity relationship patterns for grounding.",
};

type AssetFormState = {
  name: string;
  type: ContextJobAssetType;
  description: string;
  status: string;
  contentText: string;
};

function defaultContentForType(type: ContextJobAssetType): Record<string, unknown> {
  switch (type) {
    case "policy":
    case "style_guide":
      return { body: "" };
    case "glossary":
      return { terms: [] };
    case "relationship_pattern":
      return { patterns: [] };
    case "validation_contract":
      return { rules: [] };
    case "tool_profile":
      return { toolPermissions: [] };
    case "source_profile":
      return { defaultTrustLevel: "medium", defaultFreshness: "prefer_recent" };
    case "retrieval_profile":
      return {
        maxDocuments: 12,
        hybridRetrieval: true,
        queryRewriting: true,
        reranking: false,
        knowledgeSources: [],
      };
    case "memory_policy":
      return {
        sessionMemory: true,
        projectMemory: true,
        userProfileMemory: false,
        retentionDays: 30,
      };
    default:
      return {};
  }
}

function contentToEditorText(content: ContextJobAsset["content"]): string {
  if (!content) {
    return "{}";
  }
  if (typeof content === "string") {
    return content;
  }
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return "{}";
  }
}

function parseContentText(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {};
  }
  const parsed = JSON.parse(trimmed) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Asset content must be a JSON object.");
  }
  return parsed as Record<string, unknown>;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatErrorMessage(error: unknown): string {
  if (!error) return "Something went wrong.";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Something went wrong.";
}

function statusPillClass(status?: string | null): string {
  switch ((status ?? "").toLowerCase()) {
    case "active":
    case "approved":
      return "bg-emerald-100 text-emerald-700";
    case "draft":
    case "pending":
      return "bg-amber-100 text-amber-800";
    case "archived":
    case "inactive":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function emptyForm(type: ContextJobAssetType = "policy"): AssetFormState {
  return {
    name: "",
    type,
    description: "",
    status: "active",
    contentText: JSON.stringify(defaultContentForType(type), null, 2),
  };
}

function AssetsPageContent() {
  const entitlements = useContextJobsEntitlements();
  const [assets, setAssets] = useState<ContextJobAsset[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyAssetId, setBusyAssetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<ContextJobAsset | null>(null);
  const [form, setForm] = useState<AssetFormState>(emptyForm());

  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getContextJobsAssets();
      setAssets(data);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assets.filter((asset) => {
      if (typeFilter !== "all" && asset.type !== typeFilter) {
        return false;
      }
      if (!query) return true;
      const haystack = `${asset.name} ${asset.description ?? ""} ${asset.type}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [assets, search, typeFilter]);

  const openCreate = () => {
    setEditingAsset(null);
    setForm(emptyForm());
    setFeedback(null);
    setError(null);
    setEditorOpen(true);
  };

  const openEdit = (asset: ContextJobAsset) => {
    const type = (CONTEXT_JOB_ASSET_TYPES.includes(asset.type as ContextJobAssetType)
      ? asset.type
      : "policy") as ContextJobAssetType;
    setEditingAsset(asset);
    setForm({
      name: asset.name,
      type,
      description: asset.description ?? "",
      status: asset.status || "active",
      contentText: contentToEditorText(asset.content ?? defaultContentForType(type)),
    });
    setFeedback(null);
    setError(null);
    setEditorOpen(true);
  };

  const handleTypeChange = (type: ContextJobAssetType) => {
    setForm((current) => {
      // When creating, swap to the type's default skeleton. When editing, keep existing JSON.
      if (editingAsset) {
        return { ...current, type };
      }
      return {
        ...current,
        type,
        contentText: JSON.stringify(defaultContentForType(type), null, 2),
      };
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setFeedback(null);

    try {
      const content = parseContentText(form.contentText);
      const payload = {
        name: form.name.trim(),
        type: form.type,
        description: form.description.trim() || null,
        status: form.status,
        content,
      };

      if (!payload.name) {
        throw new Error("Asset name is required.");
      }

      if (editingAsset) {
        await updateContextJobsAsset(editingAsset.id, payload);
        setFeedback("Asset updated.");
      } else {
        await createContextJobsAsset(payload);
        setFeedback("Asset created.");
      }

      setEditorOpen(false);
      setEditingAsset(null);
      setForm(emptyForm());
      await loadAssets();
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (asset: ContextJobAsset) => {
    const confirmed = window.confirm(`Delete asset "${asset.name}"? This cannot be undone.`);
    if (!confirmed) return;

    setBusyAssetId(asset.id);
    setError(null);
    try {
      await deleteContextJobsAsset(asset.id);
      setFeedback(`Deleted ${asset.name}.`);
      await loadAssets();
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setBusyAssetId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_42%),linear-gradient(180deg,_#f7fcfc_0%,_#f4f8f8_100%)] px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="inline-flex rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                Context Jobs
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Assets</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Reusable policies, glossaries, validation contracts, and tool profiles you can import into any Context Job.
                Plan: {entitlements.plan || "unknown"}.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              New asset
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px]">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assets by name or description"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-teal-500/30 focus:ring-2"
            />
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-teal-500/30 focus:ring-2"
            >
              <option value="all">All types</option>
              {CONTEXT_JOB_ASSET_TYPES.map((type) => (
                <option key={type} value={type}>
                  {ASSET_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          {feedback ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {feedback}
            </div>
          ) : null}
          {error && !editorOpen ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}
        </section>

        {isLoading ? (
          <div className="flex items-center justify-center rounded-3xl border border-white/70 bg-white/80 py-16 shadow-sm backdrop-blur">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent" />
              <p className="mt-4 text-sm text-slate-600">Loading assets...</p>
            </div>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">No assets yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Create a policy, glossary, or validation contract to reuse across procurement and other Context Jobs.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-5 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Create first asset
            </button>
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredAssets.map((asset) => (
              <article
                key={asset.id}
                className="flex flex-col rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                      {ASSET_TYPE_LABELS[asset.type as ContextJobAssetType] || asset.type}
                    </p>
                    <h2 className="mt-2 truncate text-lg font-semibold text-slate-900">{asset.name}</h2>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass(asset.status)}`}>
                    {asset.status || "active"}
                  </span>
                </div>
                <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
                  {asset.description || "No description provided."}
                </p>
                <div className="mt-4 grid gap-2 text-xs text-slate-500">
                  <p>Version {asset.version ?? 1}</p>
                  <p>Updated {formatDate(asset.updatedAt)}</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(asset)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={busyAssetId === asset.id}
                    onClick={() => void handleDelete(asset)}
                    className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyAssetId === asset.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {editorOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/70 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingAsset ? "Edit asset" : "New asset"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {ASSET_TYPE_HINTS[form.type]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}
              </div>
            ) : null}

            <form className="mt-5 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</span>
                <input
                  required
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-teal-500/30 focus:ring-2"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</span>
                  <select
                    value={form.type}
                    onChange={(event) => handleTypeChange(event.target.value as ContextJobAssetType)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-teal-500/30 focus:ring-2"
                  >
                    {CONTEXT_JOB_ASSET_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {ASSET_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-teal-500/30 focus:ring-2"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={2}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-teal-500/30 focus:ring-2"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Content (JSON)</span>
                <textarea
                  value={form.contentText}
                  onChange={(event) => setForm((current) => ({ ...current, contentText: event.target.value }))}
                  rows={14}
                  spellCheck={false}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 font-mono text-xs leading-6 text-slate-100 outline-none ring-teal-500/30 focus:ring-2"
                />
              </label>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : editingAsset ? "Save changes" : "Create asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ContextJobsAssetsPage() {
  return (
    <AuthGuard>
      <AssetsPageContent />
    </AuthGuard>
  );
}
