import { store } from "@/shared/store";
import { getContextJobsEntitlements } from "@/shared/api/contextJobs";
import {
  setEntitlements,
  setEntitlementsError,
} from "@/shared/store/contextJobsEntitlementsSlice";
import { normalizeError, logError } from "@/shared/utils/errorHandler";

let refreshInFlight: Promise<void> | null = null;

/**
 * Re-fetch Context Jobs entitlements into Redux so trial usage stays current
 * after creating jobs/runs without requiring a full auth remount.
 */
export async function refreshContextJobsEntitlements(): Promise<void> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const entitlements = await getContextJobsEntitlements();
      store.dispatch(setEntitlements(entitlements));
    } catch (error) {
      const normalizedError = normalizeError(error);
      logError(normalizedError, "refreshContextJobsEntitlements");
      store.dispatch(setEntitlementsError(normalizedError.message));
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}
