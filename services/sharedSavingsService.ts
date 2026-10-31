import apiClient from '@/lib/apiClient';

export type SharedRole = 'OWNER' | 'MEMBER' | 'VIEWER';
export interface SharedProfileSummary { id: string; name: string; ownerId: string | null; role: SharedRole; isArchived: boolean; _count: { members: number; goals: number } }
export interface SharedInvitation { id: string; email?: string; role: SharedRole; expiresAt: string; profile?: { id: string; name: string } }
export interface SharedContribution { id: string; userId: string | null; authorName: string; amount: number; note: string; createdAt: string; voidedAt: string | null }
export interface SharedGoal { id: string; name: string; targetAmount: number; currentAmount: number; contributions: SharedContribution[] }
export interface SharedProfile extends SharedProfileSummary {
  canWrite: boolean; members: Array<{ id: string; userId: string; role: SharedRole; name: string; email: string }>;
  goals: SharedGoal[]; invitations: SharedInvitation[];
}
export interface SharedOverview { profiles: SharedProfileSummary[]; invitations: SharedInvitation[] }
const base = '/shared-savings';
export const sharedSavingsService = {
  async list() { return (await apiClient.get<SharedOverview>(base)).data; },
  async get(id: string) { return (await apiClient.get<SharedProfile>(`${base}/${id}`)).data; },
  async create(name: string) { return (await apiClient.post<{ id: string }>(base, { name })).data; },
  async invite(id: string, email: string, role: 'MEMBER' | 'VIEWER') { return (await apiClient.post<SharedInvitation>(`${base}/${id}/invitations`, { email, role })).data; },
  async reply(id: string, action: 'ACCEPT' | 'DECLINE') { return (await apiClient.post<{ profileId: string }>(`${base}/invitations/${id}/reply`, { action })).data; },
  async revoke(profileId: string, id: string) { return (await apiClient.delete(`${base}/${profileId}/invitations/${id}`)).data; },
  async remove(profileId: string, userId: string) { return (await apiClient.delete(`${base}/${profileId}/members/${userId}`)).data; },
  async goal(profileId: string, name: string, targetAmount: number) { return (await apiClient.post(`${base}/${profileId}/goals`, { name, targetAmount })).data; },
  async contribute(profileId: string, goalId: string, amount: number, note: string, key: string) { return (await apiClient.post(`${base}/${profileId}/goals/${goalId}/contributions`, { amount, note }, { headers: { 'Idempotency-Key': key } })).data; },
  async void(profileId: string, id: string) { return (await apiClient.delete(`${base}/${profileId}/contributions/${id}`)).data; },
  async archive(id: string) { return (await apiClient.post(`${base}/${id}/archive`)).data; },
  async leave(id: string) { return (await apiClient.post(`${base}/${id}/leave`)).data; },
};
