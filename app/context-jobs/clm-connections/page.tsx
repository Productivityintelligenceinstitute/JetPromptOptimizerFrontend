"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AuthGuard from "@/shared/components/auth/AuthGuard";
import {
  createContextJobsClmConnection,
  deleteContextJobsClmConnection,
  getContextJobsClmConnections,
  testContextJobsClmConnection,
  updateContextJobsClmConnection,
  type ContextJobsClmConnection,
} from "@/shared/api/contextJobs";

type ClmProvider = "coupa" | "ironclad";

type ClmConnectionFormState = {
  name: string;
  provider: ClmProvider;
  status: string;
  instanceUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  apiToken: string;
  baseUrl: string;
  asUserEmail: string;
};

const DEFAULT_FORM_STATE: ClmConnectionFormState = {
  name: "",
  provider: "coupa",
  status: "active",
  instanceUrl: "",
  clientId: "",
  clientSecret: "",
  scope: "core.contract.read",
  apiToken: "",
  baseUrl: "na1.ironcladapp.com",
  asUserEmail: "",
};

const PROVIDER_LABELS: Record<ClmProvider, string> = {
  coupa: "Coupa",
  ironclad: "Ironclad",
};

const PROVIDER_HINTS: Record<ClmProvider, string> = {
  coupa:
    "OAuth client credentials from Coupa Setup → Integrations → OAuth2. Scope needs core.contract.read. Instance URL looks like https://acme.coupa.com.",
  ironclad:
    "API token from Ironclad Company Settings → API. Host is usually na1, eu1, or demo.ironcladapp.com. Optional x-as-user-email for scoped access.",
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

function isClmProvider(value: string): value is ClmProvider {
  return value === "coupa" || value === "ironclad";
}

function createEmptyForm(provider: ClmProvider): ClmConnectionFormState {
  return {
    ...DEFAULT_FORM_STATE,
    provider,
    instanceUrl: "",
    clientId: "",
    clientSecret: "",
    scope: "core.contract.read",
    apiToken: "",
    baseUrl: "na1.ironcladapp.com",
    asUserEmail: "",
  };
}

function buildConfigPayload(form: ClmConnectionFormState): Record<string, unknown> | null {
  if (form.provider === "coupa") {
    return {
      instance_url: form.instanceUrl.trim(),
      client_id: form.clientId.trim(),
      client_secret: form.clientSecret.trim(),
      scope: form.scope.trim() || "core.contract.read",
    };
  }

  return {
    api_token: form.apiToken.trim(),
    base_url: form.baseUrl.trim() || "na1.ironcladapp.com",
    ...(form.asUserEmail.trim() ? { as_user_email: form.asUserEmail.trim() } : {}),
  };
}

function hasRequiredConfigFields(form: ClmConnectionFormState): boolean {
  if (form.provider === "coupa") {
    return Boolean(form.instanceUrl.trim() && form.clientId.trim() && form.clientSecret.trim());
  }
  return Boolean(form.apiToken.trim());
}

function hasAnyConfigInput(form: ClmConnectionFormState): boolean {
  return Boolean(
    form.instanceUrl.trim() ||
      form.clientId.trim() ||
      form.clientSecret.trim() ||
      form.apiToken.trim() ||
      (form.provider === "ironclad" && form.asUserEmail.trim()) ||
      (form.provider === "ironclad" &&
        form.baseUrl.trim() &&
        form.baseUrl.trim() !== DEFAULT_FORM_STATE.baseUrl),
  );
}

export default function ClmConnectionsPage() {
  const [connections, setConnections] = useState<ContextJobsClmConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<ClmConnectionFormState>(DEFAULT_FORM_STATE);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getContextJobsClmConnections();
      setConnections(data);
      setSelectedId((current) => current ?? data[0]?.id ?? null);
      if (!data.length) {
        setForm(createEmptyForm(DEFAULT_FORM_STATE.provider));
      }
    } catch (err) {
      setError(formatErrorMessage(err));
      setConnections([]);
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
    if (!selectedConnection) return;

    const providerCandidate = selectedConnection.provider || DEFAULT_FORM_STATE.provider;
    setForm({
      ...createEmptyForm(isClmProvider(providerCandidate) ? providerCandidate : "coupa"),
      name: selectedConnection.name || "",
      status: selectedConnection.status || "active",
    });
  }, [selectedConnection]);

  const startNew = (): void => {
    setSelectedId(null);
    setForm(createEmptyForm(DEFAULT_FORM_STATE.provider));
    setMessage(null);
    setError(null);
  };

  const selectConnection = (connection: ContextJobsClmConnection): void => {
    setSelectedId(connection.id);
    setMessage(null);
    setError(null);
  };

  const handleSave = async (): Promise<void> => {
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    const providerChanged = Boolean(selectedConnection && form.provider !== selectedConnection.provider);
    const shouldIncludeConfig = !selectedId || hasAnyConfigInput(form) || providerChanged;

    if (shouldIncludeConfig && !hasRequiredConfigFields(form)) {
      setError(
        form.provider === "coupa"
          ? "Coupa needs instance URL, client ID, and client secret."
          : "Ironclad needs an API token.",
      );
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setMessage(null);

      const payload = {
        name: form.name.trim(),
        provider: form.provider,
        status: form.status.trim() || "active",
      };
      const config = shouldIncludeConfig ? buildConfigPayload(form) : null;

      if (selectedId) {
        const updated = await updateContextJobsClmConnection(selectedId, {
          ...payload,
          ...(config ? { config } : {}),
        });
        setConnections((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setSelectedId(updated.id);
        setMessage(`Updated ${updated.name || "CLM connection"}. Credentials are encrypted at rest.`);
        setForm((current) => ({
          ...current,
          clientSecret: "",
          apiToken: "",
        }));
      } else {
        if (!config) {
          throw new Error("Connection config is required when creating a new connection.");
        }
        const created = await createContextJobsClmConnection({
          ...payload,
          config,
        });
        setConnections((current) => [created, ...current.filter((item) => item.id !== created.id)]);
        setSelectedId(created.id);
        setMessage(`Created ${created.name || "CLM connection"}. Credentials verified and encrypted.`);
        setForm((current) => ({
          ...current,
          clientSecret: "",
          apiToken: "",
        }));
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
      const result = await testContextJobsClmConnection(connectionId);
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
    if (!window.confirm(`Remove ${label}? You can add it again later with the same credentials.`)) {
      return;
    }

    try {
      setDeletingId(connectionId);
      setError(null);
      setMessage(null);
      await deleteContextJobsClmConnection(connectionId);
      await loadData();
      if (selectedId === connectionId) {
        startNew();
      }
      setMessage(`Removed ${label}.`);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const providerChanged = Boolean(selectedConnection && form.provider !== selectedConnection.provider);
  const shouldValidateConfig = !selectedId || hasAnyConfigInput(form) || providerChanged;
  const canSave =
    !isSaving && Boolean(form.name.trim()) && (!shouldValidateConfig || hasRequiredConfigFields(form));

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
                CLM connections
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Store Coupa or Ironclad credentials once, then paste a contract URL on any job to download the legal
                agreement into that job&apos;s knowledge target.
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
                    {selectedId ? "Update the selected connection" : "Add Coupa or Ironclad"}
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
                    placeholder="Acme Coupa prod"
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
                      const nextProvider = isClmProvider(event.target.value) ? event.target.value : "coupa";
                      setForm((current) => ({
                        ...createEmptyForm(nextProvider),
                        name: current.name,
                        status: current.status,
                      }));
                    }}
                    disabled={Boolean(selectedId)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    <option value="coupa">Coupa</option>
                    <option value="ironclad">Ironclad</option>
                  </select>
                </label>
              </div>

              {form.provider === "coupa" ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Instance URL <span className="text-rose-500">*</span>
                    </span>
                    <input
                      value={form.instanceUrl}
                      onChange={(event) => setForm((current) => ({ ...current, instanceUrl: event.target.value }))}
                      placeholder="https://acme.coupa.com"
                      autoComplete="off"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Client ID <span className="text-rose-500">*</span>
                    </span>
                    <input
                      value={form.clientId}
                      onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))}
                      placeholder="OAuth client ID"
                      autoComplete="off"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Client secret {selectedId ? "(leave blank to keep)" : <span className="text-rose-500">*</span>}
                    </span>
                    <input
                      type="password"
                      value={form.clientSecret}
                      onChange={(event) => setForm((current) => ({ ...current, clientSecret: event.target.value }))}
                      placeholder={selectedId ? "•••••••• (unchanged if blank)" : "OAuth client secret"}
                      autoComplete="new-password"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-slate-700">OAuth scope</span>
                    <input
                      value={form.scope}
                      onChange={(event) => setForm((current) => ({ ...current, scope: event.target.value }))}
                      placeholder="core.contract.read"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                  </label>
                </div>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      API token {selectedId ? "(leave blank to keep)" : <span className="text-rose-500">*</span>}
                    </span>
                    <input
                      type="password"
                      value={form.apiToken}
                      onChange={(event) => setForm((current) => ({ ...current, apiToken: event.target.value }))}
                      placeholder={selectedId ? "•••••••• (unchanged if blank)" : "Ironclad API token"}
                      autoComplete="new-password"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Host / region</span>
                    <input
                      value={form.baseUrl}
                      onChange={(event) => setForm((current) => ({ ...current, baseUrl: event.target.value }))}
                      placeholder="na1.ironcladapp.com"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">As-user email (optional)</span>
                    <input
                      value={form.asUserEmail}
                      onChange={(event) => setForm((current) => ({ ...current, asUserEmail: event.target.value }))}
                      placeholder="lawyer@acme.com"
                      autoComplete="off"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                  </label>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={!canSave}
                  className="inline-flex items-center justify-center rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {isSaving ? "Saving & verifying..." : selectedId ? "Save changes" : "Create connection"}
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

              {selectedId ? (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Secrets are never shown after save. Re-enter a secret only when rotating credentials.
                </p>
              ) : (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Jet verifies the credentials against {PROVIDER_LABELS[form.provider]} before storing them encrypted.
                </p>
              )}
            </section>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Saved connections</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">Test, edit, or remove</h2>
                </div>

                <div className="mt-4 space-y-3">
                  {isLoading ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                      Loading CLM connections...
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
                              <p className="text-sm font-semibold text-slate-900">
                                {connection.name || "Unnamed connection"}
                              </p>
                              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                                {PROVIDER_LABELS[isClmProvider(connection.provider || "") ? connection.provider as ClmProvider : "coupa"] ||
                                  connection.provider ||
                                  "unknown"}
                              </span>
                              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                                {connection.status || "active"}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              Updated {formatMaybeDate(connection.updatedAt)}
                              {connection.lastTestedAt ? ` · Tested ${formatMaybeDate(connection.lastTestedAt)}` : ""}
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
                              {deletingId === connection.id ? "Removing..." : "Remove"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                      No CLM connections yet. Add Coupa or Ironclad to import contracts by URL from a job page.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{PROVIDER_LABELS[form.provider]} setup</p>
                  <p className="mt-1 leading-6">{PROVIDER_HINTS[form.provider]}</p>
                  <p className="mt-3 leading-6">
                    After saving, open a Context Job → Ingestion → paste a{" "}
                    {form.provider === "coupa" ? (
                      <code className="rounded bg-white px-1.5 py-0.5 text-xs">/contracts/show/{"{id}"}</code>
                    ) : (
                      <>
                        <code className="rounded bg-white px-1.5 py-0.5 text-xs">/workflow/{"{id}"}</code> or{" "}
                        <code className="rounded bg-white px-1.5 py-0.5 text-xs">/record/{"{id}"}</code>
                      </>
                    )}{" "}
                    URL.
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
