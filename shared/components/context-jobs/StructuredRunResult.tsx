"use client";

import { useMemo } from "react";

type ClauseScore = {
  score?: number | string;
  status?: string;
  notes?: string;
};

type ParsedScorecard = {
  overallRiskScore?: number | string;
  renewalUrgency?: string;
  clauseScores?: Record<string, ClauseScore>;
  evidenceGaps?: unknown;
  dimensionScores?: Record<string, Record<string, number | string>>;
  overallRanking?: unknown;
  meTooRisks?: unknown;
  // Rate card scorecard
  normalizedRows?: unknown;
  unmappedTitles?: unknown;
  varianceFlags?: unknown;
  spendConcentration?: unknown;
  challengeList?: unknown;
  // Onboarding scorecard
  goNoGo?: string;
  riskTier?: string;
  openItemCount?: number | string;
  stakeholderCompletionPercent?: number | string;
  topRisks?: unknown;
  requiredApprovals?: unknown;
  [key: string]: unknown;
};

function stripJsonFence(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return (fenced?.[1] ?? trimmed).trim();
}

export function tryParseJsonResult(content: string): ParsedScorecard | null {
  const raw = stripJsonFence(content);
  if (!raw.startsWith("{") && !raw.startsWith("[")) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as ParsedScorecard;
  } catch {
    return null;
  }
}

function humanizeKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusMeta(status: string | undefined): { label: string; className: string } {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "pass" || normalized === "passed" || normalized === "ok" || normalized === "go") {
    return { label: humanizeKey(normalized === "go" ? "Go" : "Pass"), className: "bg-emerald-100 text-emerald-800" };
  }
  if (
    normalized === "watch" ||
    normalized === "warning" ||
    normalized === "warn" ||
    normalized === "conditional" ||
    normalized === "medium"
  ) {
    return {
      label: humanizeKey(normalized),
      className: "bg-amber-100 text-amber-900",
    };
  }
  if (
    normalized === "fail" ||
    normalized === "failed" ||
    normalized === "critical" ||
    normalized === "no_go" ||
    normalized === "high"
  ) {
    return {
      label: humanizeKey(normalized === "no_go" ? "No Go" : normalized),
      className: "bg-rose-100 text-rose-800",
    };
  }
  if (normalized === "low") {
    return { label: "Low", className: "bg-emerald-100 text-emerald-800" };
  }
  if (!normalized) {
    return { label: "n/a", className: "bg-slate-100 text-slate-600" };
  }
  return {
    label: humanizeKey(normalized),
    className: "bg-slate-100 text-slate-700",
  };
}

function urgencyMeta(value: string | undefined): { label: string; className: string } {
  return statusMeta(value);
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item == null) return "";
      if (typeof item === "object") {
        const record = item as Record<string, unknown>;
        const title = record.title ?? record.reason ?? record.vendor;
        if (typeof title === "string" && title.trim()) {
          const extras = [record.level, record.variancePercent, record.rate]
            .filter((part) => part != null && String(part).length > 0)
            .map(String);
          return extras.length ? `${title} (${extras.join(", ")})` : title;
        }
      }
      try {
        return JSON.stringify(item);
      } catch {
        return String(item);
      }
    })
    .filter(Boolean);
}

function asObjectRows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function ObjectTable({ rows, columns }: { rows: Record<string, unknown>[]; columns: string[] }) {
  if (!rows.length) {
    return <p className="mt-2 text-sm text-slate-500">None</p>;
  }
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 font-semibold">
                {humanizeKey(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-slate-100 align-top">
              {columns.map((col) => (
                <td key={col} className="px-3 py-2 text-slate-800">
                  {row[col] == null || row[col] === "" ? "—" : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function preferredColumns(rows: Record<string, unknown>[], preferred: string[]): string[] {
  const present = new Set<string>();
  for (const row of rows) {
    Object.keys(row).forEach((key) => present.add(key));
  }
  const ordered = preferred.filter((key) => present.has(key));
  const rest = [...present].filter((key) => !ordered.includes(key));
  return [...ordered, ...rest];
}

function ScorecardResultView({ data }: { data: ParsedScorecard }) {
  const clauseEntries = Object.entries(data.clauseScores || {});
  const evidenceGaps = asStringList(data.evidenceGaps);
  const meTooRisks = asStringList(data.meTooRisks);
  const ranking = asStringList(data.overallRanking);
  const dimensionEntries = Object.entries(data.dimensionScores || {});
  const urgency = urgencyMeta(data.renewalUrgency);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {data.overallRiskScore != null ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Overall risk score</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{String(data.overallRiskScore)}</p>
          </div>
        ) : null}
        {data.renewalUrgency ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Renewal urgency</p>
            <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${urgency.className}`}>
              {urgency.label}
            </span>
          </div>
        ) : null}
      </div>

      {clauseEntries.length ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Clause scores</p>
          <div className="space-y-2">
            {clauseEntries.map(([key, clause]) => {
              const meta = statusMeta(clause?.status);
              return (
                <div key={key} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{humanizeKey(key)}</p>
                      <p className="mt-1 text-xs text-slate-500">Score: {clause?.score ?? "n/a"}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${meta.className}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  {clause?.notes ? <p className="mt-2 text-sm leading-6 text-slate-700">{clause.notes}</p> : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {dimensionEntries.length ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dimension scores</p>
          {dimensionEntries.map(([supplier, scores]) => (
            <div key={supplier} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{humanizeKey(supplier)}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {Object.entries(scores || {}).map(([dim, score]) => (
                  <div key={dim} className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-500">{humanizeKey(dim)}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{String(score)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {ranking.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overall ranking</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
            {ranking.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {meTooRisks.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Me-too risks</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-950">
            {meTooRisks.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {evidenceGaps.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Evidence gaps</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-950">
            {evidenceGaps.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function RateCardScorecardView({
  data,
  part = "full",
}: {
  data: ParsedScorecard;
  part?: "full" | "business" | "technical";
}) {
  const rows = asObjectRows(data.normalizedRows);
  const variance = asObjectRows(data.varianceFlags);
  const concentration = asObjectRows(data.spendConcentration);
  const unmapped = asStringList(data.unmappedTitles);
  const challenges = asStringList(data.challengeList);
  const showBusiness = part !== "technical";
  const showTechnical = part !== "business";

  return (
    <div className="space-y-5">
      {showBusiness ? (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Normalized rows</p>
            <ObjectTable
              rows={rows}
              columns={preferredColumns(rows, [
                "vendor",
                "title",
                "mappedRole",
                "mappedLevel",
                "rate",
                "mapped",
              ])}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spend concentration</p>
            <ObjectTable
              rows={concentration}
              columns={preferredColumns(concentration, [
                "vendor",
                "totalSpend",
                "sharePercent",
                "rowCount",
                "basis",
              ])}
            />
          </div>

          {challenges.length ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-800">Challenge list</p>
              <ul className="mt-2 space-y-1 text-sm text-rose-950">
                {challenges.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}

      {showTechnical ? (
        <>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Variance flags</p>
            <ObjectTable
              rows={variance}
              columns={preferredColumns(variance, [
                "title",
                "level",
                "rate",
                "groupMeanRate",
                "variancePercent",
                "reason",
              ])}
            />
          </div>

          {unmapped.length ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Unmapped titles</p>
              <ul className="mt-2 space-y-1 text-sm text-amber-950">
                {unmapped.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              No unmapped titles.
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function OnboardingScorecardView({ data }: { data: ParsedScorecard }) {
  const goMeta = statusMeta(data.goNoGo);
  const riskMeta = statusMeta(data.riskTier);
  const topRisks = asStringList(data.topRisks);
  const approvals = asStringList(data.requiredApprovals);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Go / No-Go</p>
          <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${goMeta.className}`}>
            {goMeta.label}
          </span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Risk tier</p>
          <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${riskMeta.className}`}>
            {riskMeta.label}
          </span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Open items</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{String(data.openItemCount ?? "—")}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Stakeholder completion</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {data.stakeholderCompletionPercent != null ? `${data.stakeholderCompletionPercent}%` : "—"}
          </p>
        </div>
      </div>

      {topRisks.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Top risks</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-950">
            {topRisks.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {approvals.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Required approvals</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {approvals.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function GenericJsonResultView({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      {Object.entries(data).map(([key, value]) => {
        const rows = asObjectRows(value);
        if (rows.length) {
          return (
            <div key={key} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{humanizeKey(key)}</p>
              <ObjectTable rows={rows} columns={preferredColumns(rows, Object.keys(rows[0] || {}))} />
            </div>
          );
        }
        const list = asStringList(value);
        if (Array.isArray(value)) {
          return (
            <div key={key} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{humanizeKey(key)}</p>
              {list.length ? (
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {list.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">None</p>
              )}
            </div>
          );
        }
        return (
          <div key={key} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{humanizeKey(key)}</p>
            {typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? (
              <p className="mt-2 text-sm leading-6 text-slate-800">{String(value)}</p>
            ) : (
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs leading-5 text-slate-700">
                {JSON.stringify(value, null, 2)}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function StructuredRunResult({
  content,
  renderedHtml,
  part = "full",
}: {
  content: string;
  renderedHtml: string;
  part?: "full" | "business" | "technical";
}) {
  const parsed = useMemo(() => tryParseJsonResult(content), [content]);

  if (!parsed) {
    if (!renderedHtml.trim()) return null;
    return (
      <div
        className="space-y-4 text-sm"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );
  }

  const isContractOrCapabilityScorecard =
    Boolean(parsed.clauseScores) ||
    parsed.overallRiskScore != null ||
    Boolean(parsed.dimensionScores) ||
    Boolean(parsed.renewalUrgency);

  const isRateCardScorecard =
    Array.isArray(parsed.normalizedRows) ||
    Array.isArray(parsed.varianceFlags) ||
    Array.isArray(parsed.spendConcentration);

  const isOnboardingScorecard =
    parsed.goNoGo != null ||
    (parsed.riskTier != null &&
      (Array.isArray(parsed.topRisks) || Array.isArray(parsed.requiredApprovals)));

  let body = <GenericJsonResultView data={parsed} />;
  if (isContractOrCapabilityScorecard) {
    body = <ScorecardResultView data={parsed} />;
  } else if (isRateCardScorecard) {
    body = <RateCardScorecardView data={parsed} part={part} />;
  } else if (isOnboardingScorecard) {
    body = <OnboardingScorecardView data={parsed} />;
  }

  return (
    <div className="space-y-4">
      {body}
      {part === "full" ? (
        <details className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">Raw JSON</summary>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-5 text-slate-600">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  );
}

const RATE_CARD_TECHNICAL_HEADING = [
  "unmapped role",
  "unmapped title",
  "variance flag",
  "data source",
  "evidence gap",
  "taxonomy mapping",
];

function rateCardHeadingKey(line: string): string | null {
  const trimmed = line.trim();
  const markdown = /^(#{1,6})\s+(.+)$/.exec(trimmed);
  const bold = /^\*\*(.+?)\*\*:?$/.exec(trimmed);
  const colon = /^([A-Za-z][A-Za-z0-9 /&()>%-]{2,80}):$/.exec(trimmed);
  const raw = markdown?.[2] || bold?.[1] || colon?.[1];
  if (!raw) return null;
  return raw.replace(/[*_`]/g, "").split(":")[0].trim().toLowerCase();
}

function isRateCardTechnicalHeading(heading: string): boolean {
  return RATE_CARD_TECHNICAL_HEADING.some((needle) => heading.includes(needle));
}

export function splitRateCardOutput(content: string): { business: string; technical: string } {
  const text = (content || "").trim();
  if (!text) return { business: "", technical: "" };

  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const technicalKeys = ["unmappedTitles", "varianceFlags", "evidenceGaps", "dataSources"];
        const technical: Record<string, unknown> = {};
        const business: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (technicalKeys.includes(key)) technical[key] = value;
          else business[key] = value;
        }
        return {
          business: JSON.stringify(business),
          technical: Object.keys(technical).length ? JSON.stringify(technical) : "",
        };
      }
    } catch {
      // Fall through to markdown splitting.
    }
  }

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const business: string[] = [];
  const technical: string[] = [];
  let bucket = business;
  let sawHeading = false;

  for (const line of lines) {
    const heading = rateCardHeadingKey(line);
    if (heading) {
      sawHeading = true;
      bucket = isRateCardTechnicalHeading(heading) ? technical : business;
    }
    bucket.push(line);
  }

  if (!sawHeading || technical.length === 0) {
    return { business: text, technical: "" };
  }

  return {
    business: business.join("\n").trim(),
    technical: technical.join("\n").trim(),
  };
}
