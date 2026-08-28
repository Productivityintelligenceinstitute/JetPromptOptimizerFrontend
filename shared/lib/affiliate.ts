"use client";

const AFFILIATE_STORAGE_KEY = "jpo_affiliate_code";
const AFFILIATE_ACTIVE_KEY = "jpo_affiliate_active";
const LOG_PREFIX = "[AFFILIATE_DEBUG]";

/** Must match server `AFFILIATE_CODES` (comma-separated). If empty, no affiliate codes are accepted (same as backend). */
function getAffiliateAllowlist(): Set<string> {
  const raw = process.env.NEXT_PUBLIC_AFFILIATE_CODES ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Returns true only if the normalized code is on the allowlist.
 * When allowlist is empty, no code is valid (matches backend behavior).
 */
export function isAffiliateAllowed(normalizedCode: string | null): boolean {
  if (!normalizedCode) return false;
  const allow = getAffiliateAllowlist();
  if (allow.size === 0) return false;
  return allow.has(normalizedCode);
}

export function normalizeAffiliateCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const candidate = value.trim().toLowerCase();
  if (!candidate) return null;
  if (candidate.length > 50) return null;
  if (!/^[a-z0-9_-]+$/.test(candidate)) return null;
  return candidate;
}

export function getAffiliateCodeClient(searchAff?: string | null): string | null {
  if (typeof window === "undefined") return null;
  const fromSearch = normalizeAffiliateCode(searchAff);
  if (fromSearch) {
    if (!isAffiliateAllowed(fromSearch)) {
      console.info(`${LOG_PREFIX} getAffiliateCodeClient URL code not on allowlist`, { fromSearch });
      return null;
    }
    console.info(`${LOG_PREFIX} getAffiliateCodeClient from URL`, { fromSearch });
    return fromSearch;
  }
  const isActive = window.sessionStorage.getItem(AFFILIATE_ACTIVE_KEY) === "1";
  if (!isActive) {
    console.info(`${LOG_PREFIX} getAffiliateCodeClient no active affiliate session`);
    return null;
  }
  const fromSession = normalizeAffiliateCode(window.sessionStorage.getItem(AFFILIATE_STORAGE_KEY));
  if (fromSession && !isAffiliateAllowed(fromSession)) {
    clearAffiliateSessionCode();
    return null;
  }
  console.info(`${LOG_PREFIX} getAffiliateCodeClient from session`, { fromSession, isActive });
  return fromSession;
}

export function withAffiliateQuery(path: string, affiliateCode?: string | null): string {
  const aff = normalizeAffiliateCode(affiliateCode);
  if (!aff) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}aff=${encodeURIComponent(aff)}`;
}

export function setAffiliateSessionCode(affiliateCode: string): void {
  if (typeof window === "undefined") return;
  const aff = normalizeAffiliateCode(affiliateCode);
  if (!aff || !isAffiliateAllowed(aff)) return;
  window.sessionStorage.setItem(AFFILIATE_STORAGE_KEY, aff);
  window.sessionStorage.setItem(AFFILIATE_ACTIVE_KEY, "1");
  console.info(`${LOG_PREFIX} setAffiliateSessionCode`, { aff });
}

export function clearAffiliateSessionCode(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(AFFILIATE_STORAGE_KEY);
  window.sessionStorage.removeItem(AFFILIATE_ACTIVE_KEY);
  console.info(`${LOG_PREFIX} clearAffiliateSessionCode`);
}

