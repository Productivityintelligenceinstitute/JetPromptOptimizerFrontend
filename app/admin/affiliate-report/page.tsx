"use client";

import React, { useEffect, useMemo, useState } from "react";

import AdminGuard from "@/shared/components/auth/AdminGuard";
import { AdminNavbar } from "@/shared/components/navbar/AdminNavbar";
import { useAuth } from "@/shared/context/AuthContext";
import {
  getAffiliateReport,
  AffiliateReportResponse,
} from "@/shared/api/affiliateReport";

function formatMoney(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function CurrencyTotals({
  totals,
}: {
  totals: Record<string, number>;
}) {
  const entries = Object.entries(totals).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) {
    return <span className="text-gray-500">—</span>;
  }
  return (
    <div className="flex flex-col gap-0.5 text-sm">
      {entries.map(([cur, cents]) => (
        <span key={cur}>{formatMoney(cents, cur)}</span>
      ))}
    </div>
  );
}

export default function AffiliateReportPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AffiliateReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.user_id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAffiliateReport(user.user_id);
        if (!cancelled) setData(res);
      } catch (e: unknown) {
        if (!cancelled) {
          const msg =
            e && typeof e === "object" && "message" in e
              ? String((e as { message?: string }).message)
              : "Failed to load report.";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.user_id]);

  const flatSubscriptions = useMemo(() => {
    if (!data?.rows) return [];
    return data.rows.flatMap((r) =>
      r.subscriptions.map((s) => ({
        affiliate_code: r.affiliate_code,
        ...s,
      }))
    );
  }, [data]);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pt-36">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-jet-blue mb-2">
              Billing &amp; partners
            </p>
            <h1 className="text-3xl font-semibold text-[#335386] mb-2">
              Affiliate link report
            </h1>
            {data?.generated_at && (
              <p className="mt-2 text-xs text-gray-500">
                Generated: {new Date(data.generated_at).toLocaleString()}
              </p>
            )}
          </div>

          {loading && (
            <p className="text-gray-600">Loading report from Stripe…</p>
          )}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {data && !loading && (
            <>
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Total attributed subscriptions
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {data.grand_subscription_count}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:col-span-2">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Total paid revenue (all affiliates)
                  </p>
                  <div className="mt-1">
                    <CurrencyTotals totals={data.grand_totals_by_currency} />
                  </div>
                </div>
              </div>

              <p className="mb-4 text-xs text-gray-500">{data.note}</p>

              <div className="mb-10 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <h2 className="border-b border-gray-100 px-4 py-3 text-lg font-semibold text-gray-900">
                  By affiliate code
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-600">
                      <tr>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Subscriptions</th>
                        <th className="px-4 py-3">Paid revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            No subscriptions with affiliate metadata found in
                            Stripe (or none match your allowlist).
                          </td>
                        </tr>
                      ) : (
                        data.rows.map((row) => (
                          <tr
                            key={row.affiliate_code}
                            className="border-t border-gray-100"
                          >
                            <td className="px-4 py-3 font-mono text-gray-900">
                              {row.affiliate_code}
                            </td>
                            <td className="px-4 py-3">{row.subscription_count}</td>
                            <td className="px-4 py-3">
                              <CurrencyTotals totals={row.revenue_by_currency} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <h2 className="border-b border-gray-100 px-4 py-3 text-lg font-semibold text-gray-900">
                  Subscription detail
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-600">
                      <tr>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Plan</th>
                        <th className="px-4 py-3">Affiliate code</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Paid revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flatSubscriptions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            No rows.
                          </td>
                        </tr>
                      ) : (
                        flatSubscriptions.map((s) => (
                          <tr
                            key={
                              s.stripe_subscription_id ??
                              `${s.affiliate_code}-${s.customer_name}-${s.plan_name}`
                            }
                            className="border-t border-gray-100"
                          >
                            <td className="px-4 py-2 text-gray-900">
                              {s.customer_name}
                            </td>
                            <td className="px-4 py-2 text-gray-800">
                              {s.plan_name}
                            </td>
                            <td className="px-4 py-2 font-mono text-xs text-gray-800">
                              {s.affiliate_code}
                            </td>
                            <td className="px-4 py-2">{s.status}</td>
                            <td className="px-4 py-2">
                              <CurrencyTotals totals={s.revenue_by_currency} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
