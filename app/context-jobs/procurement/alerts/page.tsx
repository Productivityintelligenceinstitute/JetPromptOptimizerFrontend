"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AuthGuard from "@/shared/components/auth/AuthGuard";
import {
  dismissContextJobsProcurementAlert,
  getContextJobsProcurementAlerts,
  registerProcurementAlertContract,
  type ContextJobsProcurementAlert,
} from "@/shared/api/contextJobs";
import { useContextJobsEntitlements } from "@/shared/hooks/useContextJobsEntitlements";

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function formatDateTime(value: string | null | undefined): string {
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

function daysUntil(expiryDate: string): number | null {
  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return null;
  const now = new Date();
  const utcExpiry = Date.UTC(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((utcExpiry - utcNow) / (1000 * 60 * 60 * 24));
}

function urgencyClass(days: number | null): string {
  if (days === null) return "bg-slate-100 text-slate-700";
  if (days < 0) return "bg-rose-100 text-rose-800";
  if (days <= 30) return "bg-rose-100 text-rose-800";
  if (days <= 90) return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-800";
}

function urgencyLabel(days: number | null): string {
  if (days === null) return "Unknown";
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  return `${days}d remaining`;
}

function tierClass(tier: string): string {
  switch (tier.toLowerCase()) {
    case "high":
      return "bg-rose-100 text-rose-800";
    case "medium":
      return "bg-amber-100 text-amber-800";
    case "low":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function AlertsPageContent() {
  const entitlements = useContextJobsEntitlements();
  const [alerts, setAlerts] = useState<ContextJobsProcurementAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [contractText, setContractText] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [description, setDescription] = useState("");
  const [vendor, setVendor] = useState("");
  const [contractId, setContractId] = useState("");
  const [complexityTier, setComplexityTier] = useState("medium");
  const [isRegistering, setIsRegistering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getContextJobsProcurementAlerts();
      setAlerts(data);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const sortedAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => {
      const aDays = daysUntil(a.expiryDate) ?? Number.MAX_SAFE_INTEGER;
      const bDays = daysUntil(b.expiryDate) ?? Number.MAX_SAFE_INTEGER;
      return aDays - bDays;
    });
  }, [alerts]);

  const handleDismiss = async (alert: ContextJobsProcurementAlert) => {
    setBusyId(alert.id);
    setError(null);
    setFeedback(null);
    try {
      await dismissContextJobsProcurementAlert(alert.id);
      setAlerts((current) => current.filter((item) => item.id !== alert.id));
      setFeedback(`Dismissed alert for ${alert.vendor || alert.contractDocumentId}.`);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleRegister = async () => {
    setError(null);
    setFeedback(null);
    if (!expiryDate.trim()) {
      setError("Expiry date is required.");
      return;
    }
    if (!description.trim()) {
      setError("Add a short description so you can recognize this contract in the alerts list.");
      return;
    }
    if (!file && !contractText.trim()) {
      setError("Upload a contract file or paste contract text.");
      return;
    }

    setIsRegistering(true);
    try {
      const result = await registerProcurementAlertContract({
        file,
        contractText: contractText.trim() || undefined,
        expiryDate: expiryDate.trim(),
        description: description.trim(),
        vendor: vendor.trim() || undefined,
        contractId: contractId.trim() || undefined,
        complexityTier,
      });
      setFeedback(
        result.message,
      );
      setFile(null);
      setContractText("");
      setExpiryDate("");
      setDescription("");
      setVendor("");
      setContractId("");
      setComplexityTier("medium");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadAlerts();
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_42%),linear-gradient(180deg,_#f7fcfc_0%,_#f4f8f8_100%)] px-4 py-10 sm:px-6 lg:px-8 sm:pt-28 pt-24">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="inline-flex rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                Procurement
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Expiry alerts
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Register contracts into your Jet managed knowledge base with an expiry date. The scheduled
                monitor creates alerts in your account only — other users&apos; contracts never mix in.
                Plan: {entitlements.plan || "unknown"}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadAlerts()}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {feedback ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {feedback}
            </div>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Register contract</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Upload for expiry monitoring</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            We ingest into your Jet managed KB with forced metadata (documentType=contract, contractId,
            expiryDate). Alerts appear after the next scheduled monitor run — not immediately. For demos,
            set <code className="rounded bg-slate-100 px-1">PROCUREMENT_MONITOR_INTERVAL_MINUTES</code> in
            backend .env and restart.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Description (required)</span>
              <input
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="e.g. Acme Cloud MSA renewal — infra spend"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Expiry date (required)</span>
              <input
                type="date"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Complexity tier</span>
              <select
                value={complexityTier}
                onChange={(event) => setComplexityTier(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                <option value="low">Low (6 mo lead)</option>
                <option value="medium">Medium (12 mo lead)</option>
                <option value="high">High (18 mo lead)</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Vendor (optional)</span>
              <input
                type="text"
                value={vendor}
                onChange={(event) => setVendor(event.target.value)}
                placeholder="Acme Cloud Services"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Contract ID (optional)</span>
              <input
                type="text"
                value={contractId}
                onChange={(event) => setContractId(event.target.value)}
                placeholder="Auto-generated if blank"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Contract file (pdf / docx / txt)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md,.json"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Or paste contract text</span>
              <textarea
                value={contractText}
                onChange={(event) => setContractText(event.target.value)}
                placeholder="Paste MSA / SOW text if you are not uploading a file..."
                className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>
          </div>

          <div className="mt-5">
            <button
              type="button"
              disabled={isRegistering}
              onClick={() => void handleRegister()}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRegistering ? "Ingesting..." : "Register for monitoring"}
            </button>
          </div>
        </section>

        {isLoading ? (
          <div className="flex items-center justify-center rounded-3xl border border-white/70 bg-white/80 py-16 shadow-sm backdrop-blur">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent" />
              <p className="mt-4 text-sm text-slate-600">Loading alerts...</p>
            </div>
          </div>
        ) : sortedAlerts.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">No open alerts</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Register a contract above. After the next scheduled monitor run (when the contract is inside its
              lead window), it will appear here.
            </p>
            <Link
              href="/context-jobs/templates"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Browse procurement templates
            </Link>
          </div>
        ) : (
          <section className="space-y-4">
            {sortedAlerts.map((alert) => {
              const days = daysUntil(alert.expiryDate);
              return (
                <article
                  key={alert.id}
                  className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${urgencyClass(days)}`}>
                          {urgencyLabel(days)}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tierClass(alert.complexityTier)}`}>
                          {alert.complexityTier} complexity
                          {alert.complexityTierDefaulted ? " (defaulted)" : ""}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          Lead {alert.leadMonthsThreshold} mo
                        </span>
                      </div>
                      <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                        {alert.vendor || "Unknown vendor"}
                      </h2>
                      {alert.description ? (
                        <p className="text-sm leading-6 text-slate-700">{alert.description}</p>
                      ) : null}
                      <p className="text-sm text-slate-600">
                        Contract <span className="font-medium text-slate-900">{alert.contractDocumentId}</span>
                        {" · "}Expires {formatDate(alert.expiryDate)}
                      </p>
                      <p className="text-xs text-slate-500">Alerted {formatDateTime(alert.alertedAt)}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        type="button"
                        disabled={busyId === alert.id}
                        onClick={() => void handleDismiss(alert)}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyId === alert.id ? "Dismissing..." : "Dismiss"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}

export default function ContextJobsProcurementAlertsPage() {
  return (
    <AuthGuard>
      <AlertsPageContent />
    </AuthGuard>
  );
}
