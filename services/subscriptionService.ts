import apiClient from '@/lib/apiClient';
export interface SubscriptionSummary { plan: 'FREE' | 'PLUS'; status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED'; provider: string; currentPeriodStart: string; currentPeriodEnd: string; cancelAtPeriodEnd: boolean; paymentPending: boolean; providerActionRequired: boolean; used: { aiRequests: number; receiptScans: number }; limits: { aiRequests: number; receiptScans: number }; remaining: { aiRequests: number; receiptScans: number }; demoAvailable: boolean; billingMode: string; testCheckoutAvailable: boolean; checkoutVerificationError?: string }
export interface PayMongoStartResult { subscription: SubscriptionSummary; paymentStatus: string; authorizationUrl: string | null; message: string }
export const subscriptionService = {
  async getMine() { return (await apiClient.get<SubscriptionSummary>('/subscriptions/me')).data; },
  async startPayMongo(phone: string) { return (await apiClient.post<PayMongoStartResult>('/subscriptions/paymongo/start', { phone })).data; },
  async startTestCheckout() { return (await apiClient.post<{ checkoutUrl: string; testMode: true; subscription: SubscriptionSummary }>('/subscriptions/paymongo/test/checkout')).data; },
  async verifyTestCheckout() { return (await apiClient.post<SubscriptionSummary>('/subscriptions/paymongo/test/verify')).data; },
  async activateDemo() { return (await apiClient.post<SubscriptionSummary>('/subscriptions/demo/activate')).data; },
  async cancel() { return (await apiClient.post<SubscriptionSummary>('/subscriptions/cancel')).data; },
};
