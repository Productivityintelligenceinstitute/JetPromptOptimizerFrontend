import apiClient from './client';

export interface CreateCheckoutSessionRequest {
  planName: string;
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

/**
 * Creates a Stripe Checkout session for subscription
 */
export const createCheckoutSession = async (
  data: CreateCheckoutSessionRequest
): Promise<CreateCheckoutSessionResponse> => {
  try {
    const response = await apiClient.post<CreateCheckoutSessionResponse>(
      '/stripe/create-checkout-session',
      data
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Map plan names to Stripe Price IDs
// Using test mode price IDs (update these if you switch to live mode)
export const PLAN_TO_PRICE_ID: Record<string, string> = {
  'Essential': process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ESSENTIAL || 'price_1SkPTmKxvDwHPCEh2FJVZWk3',
  'Pro': process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || 'price_1SkPTzKxvDwHPCEhB2lDfMcy',
};

