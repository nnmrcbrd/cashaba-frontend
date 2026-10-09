import apiClient from '@/lib/apiClient';
export type PaidPlan = 'BASIC' | 'STANDARD' | 'PREMIUM';
export type SubscriptionPlan = 'FREE' | 'PLUS' | PaidPlan;
export const planLabel = (plan: SubscriptionPlan) => ({ FREE: 'Free trial', PLUS: 'Plus (legacy)', BASIC: 'Basic', STANDARD: 'Standard', PREMIUM: 'Premium' })[plan];
export interface PlanOption { id: PaidPlan; name: string; priceCents: number; aiRequests: number; receiptScans: number; currency: string; interval: string }
export interface SubscriptionSummary {
  userId: string; checkoutState: 'PROCESSING' | 'READY' | 'UNCERTAIN' | 'CLOSED' | null;
  plan: SubscriptionPlan; planName: string; accessStatus: 'TRIAL' | 'ACTIVE' | 'EXPIRED'; canWrite: boolean;
  trialStartedAt: string; trialEndsAt: string; trialDaysRemaining: number; plans: PlanOption[];
  requestedPlan: SubscriptionPlan | null; checkoutAmountCents: number | null;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED'; provider: string; currentPeriodStart: string; currentPeriodEnd: string;
  usagePeriodStart?: string; usagePeriodEnd?: string; cancelAtPeriodEnd: boolean; paymentPending: boolean; providerActionRequired: boolean;
  used: { aiRequests: number; receiptScans: number }; limits: { aiRequests: number; receiptScans: number }; remaining: { aiRequests: number; receiptScans: number };
  demoAvailable: boolean; billingMode: string; testCheckoutAvailable: boolean; checkoutVerificationError?: string;
}
export interface PayMongoStartResult { subscription: SubscriptionSummary; paymentStatus: string; authorizationUrl: string | null; message: string }
export const subscriptionService = {
  async getMine() { return (await apiClient.get<SubscriptionSummary>('/subscriptions/me')).data; },
  async startPayMongo(phone: string, plan: PaidPlan, key: string) { return (await apiClient.post<PayMongoStartResult>('/subscriptions/paymongo/start', { phone, plan }, { headers: { 'Idempotency-Key': key } })).data; },
  async startTestCheckout(plan: PaidPlan, key: string) { return (await apiClient.post<{ checkoutUrl: string; testMode: true; subscription: SubscriptionSummary }>('/subscriptions/paymongo/test/checkout', { plan }, { headers: { 'Idempotency-Key': key } })).data; },
  async verifyTestCheckout() { return (await apiClient.post<SubscriptionSummary>('/subscriptions/paymongo/test/verify')).data; },
  async activateDemo(plan: PaidPlan, key: string) { return (await apiClient.post<SubscriptionSummary>('/subscriptions/demo/activate', { plan }, { headers: { 'Idempotency-Key': key } })).data; },
  async cancel() { return (await apiClient.post<SubscriptionSummary>('/subscriptions/cancel')).data; },
};
