import apiClient from "./client";

export interface AffiliateSubscriptionRow {
  customer_name: string;
  plan_name: string;
  status: string;
  revenue_by_currency: Record<string, number>;
  /** Present for stable keys; not shown in the report table */
  stripe_subscription_id?: string;
}

export interface AffiliateReportRow {
  affiliate_code: string;
  subscription_count: number;
  revenue_by_currency: Record<string, number>;
  subscriptions: AffiliateSubscriptionRow[];
}

export interface AffiliateReportResponse {
  generated_at: string;
  source: string;
  note: string;
  rows: AffiliateReportRow[];
  grand_totals_by_currency: Record<string, number>;
  grand_subscription_count: number;
}

export async function getAffiliateReport(
  adminUserId: string
): Promise<AffiliateReportResponse> {
  const { data } = await apiClient.get<AffiliateReportResponse>(
    "/admin/affiliate-report",
    {
      params: { user_id: adminUserId },
      timeout: 120000,
    }
  );
  return data;
}
