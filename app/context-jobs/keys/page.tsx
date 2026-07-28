"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import AuthGuard from "@/shared/components/auth/AuthGuard";
import { useContextJobsEntitlements } from "@/shared/hooks/useContextJobsEntitlements";
import {
  createContextJobsLlmKey,
  createContextJobsToolKey,
  deleteContextJobsLlmKey,
  deleteContextJobsToolKey,
  getContextJobsLlmKeys,
  getContextJobsToolKeys,
  getContextJobsTools,
  verifyContextJobsLlmKey,
  type ContextJobsLlmKey,
  type ContextJobsTool,
  type ContextJobsToolKey,
} from "@/shared/api/contextJobs";

const LLM_PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI" },
  { value: "google", label: "Google Gemini" },
  { value: "anthropic", label: "Anthropic" },
] as const;

const EMBEDDING_PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI" },
  { value: "google", label: "Google Gemini" },
  { value: "cohere", label: "Cohere" },
  { value: "voyage", label: "Voyage" },
  { value: "mistral", label: "Mistral" },
  { value: "jina", label: "Jina" },
] as const;

const KEY_PURPOSE_OPTIONS = [
  { value: "llm", label: "LLM" },
  { value: "embedding", label: "Embedding" },
] as const;

type KeyPurpose = (typeof KEY_PURPOSE_OPTIONS)[number]["value"];

function providersForPurpose(purpose: KeyPurpose) {
  return purpose === "embedding" ? EMBEDDING_PROVIDER_OPTIONS : LLM_PROVIDER_OPTIONS;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function normalizeKeyPurpose(value: string | null | undefined): KeyPurpose {
  return value === "embedding" ? "embedding" : "llm";
}

function keyMatchesPurposeFilter(key: ContextJobsLlmKey, filter: KeyPurpose): boolean {
  const purpose = (key.keyPurpose || "llm").toLowerCase();
  if (purpose === "both") return true;
  return purpose === filter;
}

function getLlmKeyLabel(key: ContextJobsLlmKey): string {
  const base = key.keyLabel || key.label || key.name || key.provider || "API key";
  const suffix = key.keyLastFour ? ` ••••${key.keyLastFour}` : "";
  return `${base}${suffix}`;
}

function getToolKeyLabel(key: ContextJobsToolKey): string {
  const base = key.keyLabel || key.label || key.name || key.toolId || "Tool key";
  const suffix = key.keyLastFour ? ` ••••${key.keyLastFour}` : "";
  return `${base}${suffix}`;
}

function statusPillClass(status?: string | null): string {
  switch ((status ?? "").toLowerCase()) {
    case "active":
    case "verified":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
      return "bg-amber-100 text-amber-800";
    case "inactive":
    case "disabled":
      return "bg-slate-100 text-slate-700";
    case "error":
    case "failed":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getToolLabel(tools: ContextJobsTool[], toolId: string): string {
  return tools.find((tool) => tool.id === toolId)?.name || toolId;
}

type KeyFeedback = {
  type: "success" | "error";
  message: string;
};

function KeysPageContent() {
  const entitlements = useContextJobsEntitlements();
  const plan = (entitlements.plan ?? "").toLowerCase();
  const canManageKeys =
    entitlements.canManageKeys === true || plan === "trial" || plan === "pro" || plan === "admin";
  const hasContextJobsAccess = Boolean(entitlements.contextJobsEnabled);

  const [listPurpose, setListPurpose] = useState<KeyPurpose>("llm");
  const [llmProvider, setLlmProvider] = useState("openai");
  const [llmKeys, setLlmKeys] = useState<ContextJobsLlmKey[]>([]);
  const [toolKeys, setToolKeys] = useState<ContextJobsToolKey[]>([]);
  const [tools, setTools] = useState<ContextJobsTool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingLlm, setIsSavingLlm] = useState(false);
  const [isSavingTool, setIsSavingTool] = useState(false);
  const [busyLlmKeyId, setBusyLlmKeyId] = useState<string | null>(null);
  const [busyToolKeyId, setBusyToolKeyId] = useState<string | null>(null);
  const [llmKeyFeedback, setLlmKeyFeedback] = useState<Record<string, KeyFeedback>>({});
  const [error, setError] = useState<string | null>(null);
  const [llmForm, setLlmForm] = useState({
    keyPurpose: "llm" as KeyPurpose,
    provider: "openai",
    keyLabel: "",
    apiKey: "",
  });
  const [toolForm, setToolForm] = useState({ toolId: "", provider: "", keyLabel: "", apiKey: "" });
  const llmFeedbackTimers = useRef<Record<string, ReturnType<typeof setTimeout> | undefined>>({});

  const listProviderOptions = useMemo(() => providersForPurpose(listPurpose), [listPurpose]);
  const formProviderOptions = useMemo(() => providersForPurpose(llmForm.keyPurpose), [llmForm.keyPurpose]);

  const selectedToolDefinition = useMemo(
    () => tools.find((tool) => tool.id === toolForm.toolId) ?? null,
    [toolForm.toolId, tools]
  );

  const selectableToolDefinitions = useMemo(
    () => tools.filter((tool) => tool.externalProvider),
    [tools]
  );

  const displayedLlmKeys = useMemo(
    () =>
      llmKeys.filter((key) => {
        if (!keyMatchesPurposeFilter(key, listPurpose)) return false;
        if (llmProvider && key.provider && key.provider !== llmProvider) return false;
        return true;
      }),
    [llmKeys, listPurpose, llmProvider]
  );

  useEffect(() => {
    if (entitlements.status !== "succeeded" || !hasContextJobsAccess || !canManageKeys) {
      return;
    }

    let mounted = true;

    const loadData = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const toolRequests = Promise.all([getContextJobsToolKeys(), getContextJobsTools()]);
        const [llm, [toolKeyList, toolCatalog]] = await Promise.all([
          getContextJobsLlmKeys(undefined, listPurpose),
          toolRequests,
        ]);

        if (!mounted) return;

        setLlmKeys(llm);
        setToolKeys(toolKeyList);
        setTools(toolCatalog);

        const nextTool = toolCatalog.find((tool) => tool.externalProvider);
        if (nextTool) {
          setToolForm((current) => ({
            ...current,
            toolId: current.toolId || nextTool.id,
            provider: current.provider || String(nextTool.externalProvider || ""),
          }));
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load key data");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, [canManageKeys, entitlements.status, hasContextJobsAccess, listPurpose]);

  useEffect(() => {
    return () => {
      Object.values(llmFeedbackTimers.current).forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
      llmFeedbackTimers.current = {};
    };
  }, []);

  useEffect(() => {
    const selected = tools.find((tool) => tool.id === toolForm.toolId);
    if (!selected) return;

    const nextProvider = String(selected.externalProvider || "");
    setToolForm((current) => {
      if (current.provider === nextProvider) return current;
      return { ...current, provider: nextProvider };
    });
  }, [toolForm.toolId, tools]);

  const refresh = async (): Promise<void> => {
    if (!canManageKeys) return;

    try {
      setError(null);
      setIsLoading(true);
      const [llm, toolKeyList, toolCatalog] = await Promise.all([
        getContextJobsLlmKeys(undefined, listPurpose),
        getContextJobsToolKeys(),
        getContextJobsTools(),
      ]);
      setLlmKeys(llm);
      setToolKeys(toolKeyList);
      setTools(toolCatalog);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Failed to refresh keys");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLlmKey = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!llmForm.keyLabel.trim() || !llmForm.apiKey.trim()) return;

    try {
      setIsSavingLlm(true);
      setError(null);
      await createContextJobsLlmKey({
        provider: llmForm.provider,
        keyLabel: llmForm.keyLabel.trim(),
        apiKey: llmForm.apiKey.trim(),
        keyPurpose: llmForm.keyPurpose,
      });
      setLlmForm((current) => ({ ...current, keyLabel: "", apiKey: "" }));
      if (llmForm.keyPurpose !== listPurpose) {
        setListPurpose(llmForm.keyPurpose);
      } else {
        await refresh();
      }
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to add LLM key");
    } finally {
      setIsSavingLlm(false);
    }
  };

  const handleVerifyLlmKey = async (keyId: string): Promise<void> => {
    try {
      setBusyLlmKeyId(keyId);
      setError(null);
      await verifyContextJobsLlmKey(keyId);
      await refresh();
      setLlmKeyFeedback((current) => ({
        ...current,
        [keyId]: { type: "success", message: "Verification succeeded." },
      }));
    } catch (verifyError) {
      const message = verifyError instanceof Error ? verifyError.message : "Failed to verify LLM key";
      setLlmKeyFeedback((current) => ({
        ...current,
        [keyId]: { type: "error", message },
      }));
    } finally {
      setBusyLlmKeyId(null);
      if (llmFeedbackTimers.current[keyId]) {
        clearTimeout(llmFeedbackTimers.current[keyId]);
      }
      llmFeedbackTimers.current[keyId] = setTimeout(() => {
        setLlmKeyFeedback((current) => {
          const next = { ...current };
          delete next[keyId];
          return next;
        });
        delete llmFeedbackTimers.current[keyId];
      }, 3500);
    }
  };

  const handleDeleteLlmKey = async (keyId: string): Promise<void> => {
    if (!window.confirm("Delete this LLM key?")) return;

    try {
      setBusyLlmKeyId(keyId);
      setError(null);
      await deleteContextJobsLlmKey(keyId);
      await refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete LLM key");
    } finally {
      setBusyLlmKeyId(null);
    }
  };

  const handleCreateToolKey = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!toolForm.toolId.trim() || !toolForm.provider.trim() || !toolForm.keyLabel.trim() || !toolForm.apiKey.trim()) return;

    try {
      setIsSavingTool(true);
      setError(null);
      await createContextJobsToolKey({
        toolId: toolForm.toolId,
        provider: toolForm.provider,
        keyLabel: toolForm.keyLabel.trim(),
        apiKey: toolForm.apiKey.trim(),
      });
      setToolForm((current) => ({ ...current, keyLabel: "", apiKey: "" }));
      await refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to add tool key");
    } finally {
      setIsSavingTool(false);
    }
  };

  const handleDeleteToolKey = async (keyId: string): Promise<void> => {
    if (!window.confirm("Delete this tool key?")) return;

    try {
      setBusyToolKeyId(keyId);
      setError(null);
      await deleteContextJobsToolKey(keyId);
      await refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete tool key");
    } finally {
      setBusyToolKeyId(null);
    }
  };

  if (entitlements.status === "succeeded" && !hasContextJobsAccess) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_42%),linear-gradient(180deg,_#f8fbff_0%,_#f5f7fb_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Upgrade required</p>
            <h1 className="mt-3 text-2xl font-semibold text-amber-950">Context Jobs are not enabled for this account</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-900/80">
              Your current plan does not allow Context Jobs access. Upgrade to use BYOK key management.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (entitlements.status === "succeeded" && !canManageKeys) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_42%),linear-gradient(180deg,_#f8fbff_0%,_#f5f7fb_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Key management unavailable</p>
            <h1 className="mt-3 text-2xl font-semibold text-amber-950">BYOK key management is not available</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-900/80">
              Your plan can use Context Jobs, but key management is not enabled for this account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_42%),linear-gradient(180deg,_#f7fcfc_0%,_#f4f8f8_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">Keys</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Manage BYOK keys</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Keep your LLM keys and tool keys in one place. This page uses the dedicated Context Jobs key endpoints.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : null}

        {isLoading || entitlements.status === "loading" ? (
          <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-sm backdrop-blur">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent" />
            <p className="mt-4 text-sm text-slate-600">Loading keys...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Provider keys</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">Add, verify, and revoke provider keys</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Choose a key purpose, select a provider, add a label and API key, then verify the saved key against the provider API.
                  </p>
                </div>
                <div className="flex flex-col items-stretch gap-3 sm:items-end">
                  <div className="flex flex-wrap gap-2">
                    {KEY_PURPOSE_OPTIONS.map((purpose) => (
                      <button
                        key={purpose.value}
                        type="button"
                        onClick={() => {
                          const nextProviders = providersForPurpose(purpose.value);
                          const nextProvider = nextProviders[0]?.value ?? "openai";
                          setListPurpose(purpose.value);
                          setLlmProvider(nextProvider);
                          setLlmForm((current) => ({
                            ...current,
                            keyPurpose: purpose.value,
                            provider: nextProviders.some((item) => item.value === current.provider)
                              ? current.provider
                              : nextProvider,
                          }));
                        }}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                          listPurpose === purpose.value
                            ? "bg-teal-700 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {purpose.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {listProviderOptions.map((provider) => (
                      <button
                        key={provider.value}
                        type="button"
                        onClick={() => {
                          setLlmProvider(provider.value);
                          setLlmForm((current) => ({ ...current, provider: provider.value }));
                        }}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                          llmProvider === provider.value
                            ? "bg-slate-900 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {provider.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <form className="mt-6 grid gap-4 md:grid-cols-[140px_160px_1fr_1fr_auto]" onSubmit={handleCreateLlmKey}>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Purpose</span>
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    value={llmForm.keyPurpose}
                    onChange={(e) => {
                      const nextPurpose = e.target.value as KeyPurpose;
                      const nextProviders = providersForPurpose(nextPurpose);
                      const nextProvider = nextProviders[0]?.value ?? "openai";
                      setLlmForm((current) => ({
                        ...current,
                        keyPurpose: nextPurpose,
                        provider: nextProvider,
                      }));
                      setListPurpose(nextPurpose);
                      setLlmProvider(nextProvider);
                    }}
                  >
                    {KEY_PURPOSE_OPTIONS.map((purpose) => (
                      <option key={purpose.value} value={purpose.value}>
                        {purpose.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Provider</span>
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    value={llmForm.provider}
                    onChange={(e) => {
                      const nextProvider = e.target.value;
                      setLlmProvider(nextProvider);
                      setLlmForm((current) => ({ ...current, provider: nextProvider }));
                    }}
                  >
                    {formProviderOptions.map((provider) => (
                      <option key={provider.value} value={provider.value}>
                        {provider.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Key label</span>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    autoComplete="off"
                    placeholder="Enter a key label"
                    value={llmForm.keyLabel}
                    onChange={(e) => setLlmForm((current) => ({ ...current, keyLabel: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">API key</span>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    autoComplete="new-password"
                    placeholder="Enter your API key"
                    type="password"
                    value={llmForm.apiKey}
                    onChange={(e) => setLlmForm((current) => ({ ...current, apiKey: e.target.value }))}
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSavingLlm}
                  className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingLlm ? "Saving..." : "Add key"}
                </button>
              </form>

              <div className="mt-6 space-y-3">
                {displayedLlmKeys.length ? (
                  displayedLlmKeys.map((key) => {
                    const purpose = normalizeKeyPurpose(key.keyPurpose);
                    return (
                      <div key={key.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">{getLlmKeyLabel(key)}</p>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  purpose === "embedding"
                                    ? "bg-violet-100 text-violet-700"
                                    : "bg-sky-100 text-sky-700"
                                }`}
                              >
                                {purpose === "embedding" ? "Embedding" : "LLM"}
                              </span>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass(key.status)}`}>
                                {key.status || "unknown"}
                              </span>
                              {key.isPlatformKey ? (
                                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Platform</span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-sm text-slate-600">
                              Provider: {key.provider || "Not set"} · Created {formatDate(key.createdAt)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Verified {formatDate(key.lastVerifiedAt)} · Uses {key.usageCount ?? 0}
                            </p>
                            {llmKeyFeedback[key.id] ? (
                              <div
                                className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${
                                  llmKeyFeedback[key.id].type === "success"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                    : "border-rose-200 bg-rose-50 text-rose-800"
                                }`}
                              >
                                {llmKeyFeedback[key.id].message}
                              </div>
                            ) : null}
                            {key.lastError ? <p className="mt-2 text-sm text-rose-700">{key.lastError}</p> : null}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={busyLlmKeyId === key.id}
                              onClick={() => void handleVerifyLlmKey(key.id)}
                              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {busyLlmKeyId === key.id ? "Working..." : "Verify"}
                            </button>
                            <button
                              type="button"
                              disabled={busyLlmKeyId === key.id || Boolean(key.isPlatformKey)}
                              onClick={() => void handleDeleteLlmKey(key.id)}
                              className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                    No {listPurpose === "embedding" ? "embedding" : "LLM"} keys found for this provider.
                  </div>
                )}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
              <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Tool keys</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Add tool-specific API keys</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Pick a tool that needs an external provider key and save the key against that tool.
                </p>

                {selectableToolDefinitions.length ? (
                  <form className="mt-6 space-y-4" onSubmit={handleCreateToolKey}>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Tool</span>
                      <select
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        value={toolForm.toolId}
                        onChange={(e) => {
                          const nextToolId = e.target.value;
                          const nextTool = tools.find((tool) => tool.id === nextToolId);
                          setToolForm((current) => ({
                            ...current,
                            toolId: nextToolId,
                            provider: String(nextTool?.externalProvider || current.provider || ""),
                            keyLabel: current.keyLabel || (nextTool ? `${nextTool.name} key` : current.keyLabel),
                          }));
                        }}
                      >
                        {selectableToolDefinitions.map((tool) => (
                          <option key={tool.id} value={tool.id}>
                            {tool.name} {tool.externalProvider ? `(${tool.externalProvider})` : ""}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Provider</span>
                      <input
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                        value={toolForm.provider || selectedToolDefinition?.externalProvider || ""}
                        readOnly
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Key label</span>
                      <input
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        autoComplete="off"
                        placeholder="Enter a key label"
                        value={toolForm.keyLabel}
                        onChange={(e) => setToolForm((current) => ({ ...current, keyLabel: e.target.value }))}
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">API key</span>
                      <input
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        autoComplete="new-password"
                        placeholder="Enter your API key"
                        type="password"
                        value={toolForm.apiKey}
                        onChange={(e) => setToolForm((current) => ({ ...current, apiKey: e.target.value }))}
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={isSavingTool || !toolForm.toolId || !toolForm.provider}
                      className="inline-flex h-12 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingTool ? "Saving..." : "Add tool key"}
                    </button>
                  </form>
                ) : null}
              </div>

              <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Saved tool keys</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Current tool key inventory</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {toolKeys.length}
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {toolKeys.length ? (
                    toolKeys.map((key) => (
                      <div key={key.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">{getToolKeyLabel(key)}</p>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass(key.status)}`}>
                                {key.status || "unknown"}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-600">
                              Tool: {getToolLabel(tools, key.toolId || "")} · Provider: {key.provider || "Not set"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Created {formatDate(key.createdAt)} · Verified {formatDate(key.lastVerifiedAt)}
                            </p>
                            {key.lastError ? <p className="mt-2 text-sm text-rose-700">{key.lastError}</p> : null}
                          </div>

                          <button
                            type="button"
                            disabled={busyToolKeyId === key.id}
                            onClick={() => void handleDeleteToolKey(key.id)}
                            className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {busyToolKeyId === key.id ? "Working..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                      No tool keys have been saved yet.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContextJobsKeysPage() {
  return (
    <AuthGuard>
      <KeysPageContent />
    </AuthGuard>
  );
}
