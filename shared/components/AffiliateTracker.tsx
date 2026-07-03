"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  normalizeAffiliateCode,
  setAffiliateSessionCode,
  clearAffiliateSessionCode,
  isAffiliateAllowed,
} from "@/shared/lib/affiliate";

export default function AffiliateTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const rawAff = searchParams.get("aff");
    // Key missing: nothing to validate in URL
    if (rawAff === null) return;

    const normalized = normalizeAffiliateCode(rawAff);
    const valid = Boolean(normalized && isAffiliateAllowed(normalized));

    if (!valid) {
      clearAffiliateSessionCode();
      // Hard-fail invalid affiliate links by redirecting away from app flows.
      if (pathname !== "/invalid-affiliate") {
        router.replace("/invalid-affiliate");
      }
      return;
    }

    setAffiliateSessionCode(normalized!);
  }, [pathname, router, searchParams]);
  return null;
}
