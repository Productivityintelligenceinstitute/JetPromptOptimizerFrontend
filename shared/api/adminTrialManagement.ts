const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ExtendTrialRequest {
  user_email: string;
  days: number;
}

export interface ExtendTrialResponse {
  status: string;
  user_email: string;
  days_added: number;
  previous_end_date: string | null;
  new_end_date: string | null;
  subscription_status: string;
}

export interface UserChangeLogItem {
  id: string;
  action: string;
  performed_by: string | null;
  old_status: string | null;
  new_status: string | null;
  old_end_date: string | null;
  new_end_date: string | null;
  note: string | null;
  created_at: string;
}

export interface UserChangeLogsResponse {
  user_id: string;
  items: UserChangeLogItem[];
}

function buildUrl(path: string, queryParams?: Record<string, string>): string {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined");
  }

  const url = new URL(path, API_BASE_URL);

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }

  return url.toString();
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await response.json();
    if (typeof payload?.detail === "string" && payload.detail.trim()) {
      return payload.detail;
    }

    if (Array.isArray(payload?.detail)) {
      return payload.detail
        .map((item: { msg?: string; loc?: Array<string | number> }) => item?.msg || "")
        .filter(Boolean)
        .join(", ") || fallback;
    }

    if (typeof payload?.message === "string" && payload.message.trim()) {
      return payload.message;
    }
  } catch {
    // Ignore JSON parse failures and fall back to the default message.
  }

  return fallback;
}

async function requestJson<T>(
  path: string,
  init: RequestInit,
  fallbackErrorMessage: string,
  queryParams?: Record<string, string>
): Promise<T> {
  const headers = new Headers(init.headers || undefined);
  if (init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildUrl(path, queryParams), {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, fallbackErrorMessage));
  }

  return (await response.json()) as T;
}

export async function extendTrial(
  adminUserId: string,
  payload: ExtendTrialRequest
): Promise<ExtendTrialResponse> {
  return requestJson<ExtendTrialResponse>(
    "/admin/extend-trial",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    "Failed to extend trial.",
    { user_id: adminUserId }
  );
}

export async function getUserChangeLogs(
  adminUserId: string,
  targetUserId: string
): Promise<UserChangeLogsResponse> {
  return requestJson<UserChangeLogsResponse>(
    `/admin/users/${encodeURIComponent(targetUserId)}/change-logs`,
    {
      method: "GET",
    },
    "Not authorized or invalid user.",
    { admin_user_id: adminUserId }
  );
}
