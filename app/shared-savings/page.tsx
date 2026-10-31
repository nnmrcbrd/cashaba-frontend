"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Users, Plus, PiggyBank, ShieldCheck } from 'lucide-react';
import Sidebar from '@/app/components/ui/sidebar';
import { ValidatedForm, ValidatedInput, ValidatedSelect } from '@/app/components/ui/ValidatedForm';
import { useAuth } from '@/context/Authcontext';
import { sharedSavingsService as api, type SharedGoal, type SharedOverview, type SharedProfile } from '@/services/sharedSavingsService';
import styles from './sharedSavings.module.css';

const currency = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
const roleLabel = (role: string) => ({ OWNER: 'Owner', MEMBER: 'Contributor', VIEWER: 'Viewer' })[role] ?? role;
function errorMessage(error: unknown) {
  return axios.isAxiosError<{ message?: string; errors?: Array<{ message: string }> }>(error)
    ? error.response?.data?.errors?.[0]?.message || error.response?.data?.message || 'Unable to reach shared savings. Try again.' : 'Unable to complete this action. Try again.';
}

export default function SharedSavingsPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<SharedOverview>({ profiles: [], invitations: [] });
  const [selected, setSelected] = useState('');
  const [loadedProfile, setProfile] = useState<SharedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [creating, setCreating] = useState(false);
  const inFlight = useRef(false);
  const detailRequest = useRef(0);
  const selectedRef = useRef(selected);
  const profile = loadedProfile?.id === selected ? loadedProfile : null;

  const loadList = useCallback(async () => {
    const result = await api.list();
    setOverview(result);
    setSelected(current => result.profiles.some(item => item.id === current) ? current : result.profiles[0]?.id ?? '');
    return result;
  }, []);
  const loadProfile = useCallback(async (id: string) => {
    const request = ++detailRequest.current;
    if (!id) { setProfile(null); return; }
    setDetailLoading(true);
    try { const result = await api.get(id); if (request === detailRequest.current && selectedRef.current === id) setProfile(result); }
    finally { if (request === detailRequest.current) setDetailLoading(false); }
  }, []);

  useEffect(() => { let active = true; api.list().then(result => {
    if (!active) return;
    setOverview(result); setSelected(result.profiles[0]?.id ?? '');
  }).catch(error => { if (active) setError(errorMessage(error)); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  useEffect(() => {
    selectedRef.current = selected;
    const frame = window.requestAnimationFrame(() => {
      setProfile(null);
      void loadProfile(selected).catch(error => setError(errorMessage(error)));
    });
    return () => { window.cancelAnimationFrame(frame); };
  }, [selected, loadProfile]);

  async function mutate<T>(work: () => Promise<T>, message: string, refreshId = selected): Promise<T | null> {
    if (inFlight.current) return null;
    inFlight.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const result = await work();
      setNotice(message);
      try {
        await loadList();
        if (refreshId && refreshId === selectedRef.current) await loadProfile(refreshId);
      } catch { setError('Your change was saved, but the latest view could not be loaded. Retry loading before adding another record.'); }
      return result;
    } catch (error) { setError(errorMessage(error)); return null; }
    finally { inFlight.current = false; setBusy(false); }
  }

  const owner = profile?.role === 'OWNER';
  const canContribute = Boolean(profile?.canWrite && profile.role !== 'VIEWER');
  return <div className="flex min-h-screen bg-[#f7f9f8]"><Sidebar /><main className="app-main">
    <header className="app-page-header mb-6"><p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Save together</p><h1>Shared savings</h1><p className="mt-2 max-w-2xl text-sm text-gray-500">Create a savings profile for your family, partner, or group. Everyone uses their own login and chooses whether to join.</p></header>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><p className="flex items-center gap-2"><ShieldCheck size={18} />Personal wallets, transactions, and budgets stay private.</p><Link href="/budget" className="font-semibold underline">My personal goals</Link></div>
    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}<button className="ml-3 font-semibold underline" disabled={busy} onClick={() => void loadList().then(() => loadProfile(selected)).then(() => setError('')).catch(error => setError(errorMessage(error)))}>Retry loading</button></div>}
    {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
    {overview.invitations.length > 0 && <section className={`${styles.card} mb-6`} aria-label="Your invitations"><h2 className="mb-3 font-bold">You’re invited</h2><p className="mb-4 text-xs text-gray-500">Joining shares your name, email, and any contribution records you add with this profile’s members. It does not share your personal finances.</p><div className="space-y-3">{overview.invitations.map(invite => <div key={invite.id} className={styles.row}><div><strong className="text-sm">{invite.profile?.name}</strong><p className="text-xs text-gray-500">{roleLabel(invite.role)} · Expires {new Date(invite.expiresAt).toLocaleDateString('en-PH')}</p></div><div className="flex gap-2"><button className={styles.secondary} disabled={busy} onClick={() => void mutate(() => api.reply(invite.id, 'DECLINE'), 'Invitation declined.', '')}>Decline</button><button className={styles.primary} disabled={busy} onClick={async () => { const result = await mutate(() => api.reply(invite.id, 'ACCEPT'), 'You joined the shared profile.', ''); if (result) setSelected(result.profileId); }}>Accept invitation</button></div></div>)}</div></section>}
    {loading ? <p role="status" className="py-12 text-sm text-gray-500">Loading shared profiles…</p> : <div className={styles.layout}>
      <aside className={styles.card} aria-label="Savings profiles"><div className={`${styles.row} mb-4`}><h2 className="flex items-center gap-2 font-bold"><Users size={18} />Profiles</h2><button aria-label="Create shared profile" onClick={() => setCreating(value => !value)} className={styles.secondary}><Plus size={16} /></button></div><div className={styles.profileList}>{overview.profiles.map(item => <button key={item.id} aria-pressed={selected === item.id} onClick={() => { setSelected(item.id); setError(''); }} className={`${styles.profileButton} ${selected === item.id ? styles.selected : ''}`}><strong className="block text-sm">{item.name}</strong><span className="text-xs text-gray-500">{roleLabel(item.role)} · {item._count.members} members{item.isArchived ? ' · Archived' : ''}</span></button>)}{!overview.profiles.length && <p className="text-sm leading-6 text-gray-500">Create a profile or accept an invitation to get started.</p>}</div>
        {creating && <CreateProfileForm busy={busy} onCreate={async name => { const result = await mutate(() => api.create(name), 'Shared profile created.', ''); if (result) { setSelected(result.id); setCreating(false); } return Boolean(result); }} />}
        <p className="mt-5 text-xs leading-5 text-gray-500">Up to 5 active profiles and 10 members per profile. Invitations appear here after the invited person signs in with the matching verified email.</p>
      </aside>
      <div className="min-w-0 space-y-5">{detailLoading ? <p role="status" className="p-6 text-sm text-gray-500">Loading this profile…</p> : !profile ? <section className={`${styles.card} py-12 text-center`}><PiggyBank size={36} className="mx-auto text-emerald-700" /><h2 className="mt-4 text-lg font-bold">A goal you can work on together</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">Create a shared profile, add a goal, then invite contributors or viewers.</p><button className={`${styles.primary} mt-5`} onClick={() => setCreating(true)}>Create a shared profile</button></section> : <>
        <section className={styles.card}><div className={styles.row}><div><h2 className="text-xl font-bold">{profile.name}</h2><p className="mt-1 text-xs text-gray-500">{roleLabel(profile.role)} · {profile.members.length} members · {profile.goals.length} goals</p></div>{owner ? <button className={styles.secondary} disabled={busy || profile.isArchived} onClick={() => { if (window.confirm('Archive this profile? Members can still view the history, but no one can add new records.')) void mutate(() => api.archive(profile.id), 'Profile archived. History remains available.'); }}>Archive profile</button> : <button className={styles.secondary} disabled={busy} onClick={() => { if (window.confirm('Leave this profile? Your recorded contributions will remain in its history.')) void mutate(() => api.leave(profile.id), 'You left the profile.', ''); }}>Leave profile</button>}</div><p className="mt-4 text-xs leading-5 text-gray-500">Shared savings is a record book. Record contributions already made outside Casha-Ba. These entries do not move money or change your personal wallet balances.</p>{!profile.canWrite && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{profile.isArchived ? 'This profile is archived.' : 'The profile owner needs active plan access to make changes.'} Existing records remain available to view.</p>}{profile.role === 'VIEWER' && <p className="mt-3 text-xs text-gray-500">You have view-only access. Only the owner and contributors can record savings.</p>}</section>
        {owner && profile.canWrite && <div className={styles.forms}><GoalForm busy={busy} onCreate={async (name, amount) => Boolean(await mutate(() => api.goal(profile.id, name, amount), 'Shared goal created.'))} /><InviteForm busy={busy} onInvite={async (email, role) => Boolean(await mutate(() => api.invite(profile.id, email, role), 'Invitation ready. Ask the person to sign in and open Shared savings.'))} /></div>}
        {profile.goals.map(goal => <section key={goal.id} className={styles.card}><div className={styles.row}><h3 className="font-bold">{goal.name}</h3><span className="text-sm font-semibold text-emerald-700">{currency(goal.currentAmount)} / {currency(goal.targetAmount)}</span></div><div className={styles.progress} role="progressbar" aria-label={`${goal.name} progress`} aria-valuemin={0} aria-valuemax={goal.targetAmount} aria-valuenow={Math.min(goal.currentAmount, goal.targetAmount)}><div style={{ width: `${Math.min(100, goal.currentAmount / goal.targetAmount * 100)}%` }} /></div><p className="text-xs text-gray-500">{goal.currentAmount >= goal.targetAmount ? 'Target reached' : `${currency(goal.targetAmount - goal.currentAmount)} remaining`}</p>{canContribute && <ContributionForm goal={goal} busy={busy} onContribute={async (amount, note, key) => Boolean(await mutate(() => api.contribute(profile.id, goal.id, amount, note, key), 'Contribution recorded.'))} />}
          <div className="mt-5 overflow-x-auto"><table className={styles.table}><caption className="mb-2 text-left text-xs font-semibold">Contribution history</caption><thead><tr><th>Contributor</th><th>Amount</th><th>Date / Note</th><th>Status</th></tr></thead><tbody>{goal.contributions.map(row => <tr key={row.id}><td>{row.authorName}</td><td className={row.voidedAt ? 'line-through text-gray-400' : 'font-semibold'}>{currency(row.amount)}</td><td>{new Date(row.createdAt).toLocaleDateString('en-PH')}{row.note && <p className="mt-1 text-gray-500">{row.note}</p>}</td><td>{row.voidedAt ? 'Voided' : canContribute && (owner || row.userId === user?.id) ? <button disabled={busy} className="font-semibold text-red-700 underline" onClick={() => { if (window.confirm('Void this contribution? It stays in the history but no longer counts toward the goal.')) void mutate(() => api.void(profile.id, row.id), 'Contribution voided.'); }}>Void entry</button> : 'Recorded'}</td></tr>)}{!goal.contributions.length && <tr><td colSpan={4} className="text-gray-500">No contributions yet.</td></tr>}</tbody></table></div>
        </section>)}
        <section className={styles.card}><h3 className="mb-3 font-bold">Members</h3><div className="space-y-3">{profile.members.map(member => <div key={member.id} className={styles.row}><div><strong className="text-sm">{member.name}</strong><p className="text-xs text-gray-500">{member.email} · {roleLabel(member.role)}</p></div>{owner && member.role !== 'OWNER' && <button className="text-xs font-semibold text-red-700 underline" disabled={busy} onClick={() => { if (window.confirm(`Remove ${member.name}? They will lose access to this profile.`)) void mutate(() => api.remove(profile.id, member.userId), 'Member removed. Their contribution history is preserved.'); }}>Remove</button>}</div>)}</div>{owner && profile.invitations.length > 0 && <div className="mt-5 border-t pt-4"><h4 className="mb-3 text-sm font-semibold">Pending invitations</h4>{profile.invitations.map(invite => <div key={invite.id} className={`${styles.row} mb-3`}><p className="text-xs">{invite.email} · {roleLabel(invite.role)}</p><button className="text-xs font-semibold text-red-700 underline" disabled={busy} onClick={() => void mutate(() => api.revoke(profile.id, invite.id), 'Invitation revoked.')}>Revoke</button></div>)}</div>}</section>
      </>}</div>
    </div>}
  </main></div>;
}

function CreateProfileForm({ busy, onCreate }: { busy: boolean; onCreate: (name: string) => Promise<boolean> }) {
  const [name, setName] = useState('');
  return <ValidatedForm className="mt-5 space-y-3 border-t pt-4" onSubmit={async event => { event.preventDefault(); if (await onCreate(name.trim())) setName(''); }}><label className="block text-xs font-semibold" htmlFor="profile-name">Profile name<ValidatedInput id="profile-name" value={name} onChange={event => setName(event.target.value)} required maxLength={80} placeholder="e.g. Our family" className={styles.input} /></label><button disabled={busy} className={styles.primary}>Create profile</button></ValidatedForm>;
}
function GoalForm({ busy, onCreate }: { busy: boolean; onCreate: (name: string, amount: number) => Promise<boolean> }) {
  const [name, setName] = useState(''), [amount, setAmount] = useState('');
  return <ValidatedForm className={`${styles.card} space-y-3`} onSubmit={async event => { event.preventDefault(); if (await onCreate(name.trim(), Number(amount))) { setName(''); setAmount(''); } }}><h3 className="font-bold">Add a shared goal</h3><label className="block text-xs font-semibold" htmlFor="shared-goal-name">Goal name<ValidatedInput id="shared-goal-name" value={name} onChange={event => setName(event.target.value)} required maxLength={120} className={styles.input} /></label><label className="block text-xs font-semibold" htmlFor="shared-goal-target">Target amount (₱)<ValidatedInput id="shared-goal-target" type="number" min="0.01" max="999999999999.99" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} required className={styles.input} /></label><button disabled={busy} className={styles.primary}>Add goal</button></ValidatedForm>;
}
function InviteForm({ busy, onInvite }: { busy: boolean; onInvite: (email: string, role: 'MEMBER' | 'VIEWER') => Promise<boolean> }) {
  const [email, setEmail] = useState(''), [role, setRole] = useState<'MEMBER' | 'VIEWER'>('MEMBER');
  return <ValidatedForm className={`${styles.card} space-y-3`} onSubmit={async event => { event.preventDefault(); if (await onInvite(email.trim().toLowerCase(), role)) setEmail(''); }}><h3 className="font-bold">Invite a member</h3><label className="block text-xs font-semibold" htmlFor="invite-email">Their Casha-Ba email<ValidatedInput id="invite-email" type="email" value={email} onChange={event => setEmail(event.target.value)} required maxLength={254} className={styles.input} /></label><label className="block text-xs font-semibold" htmlFor="invite-role">Permission<ValidatedSelect id="invite-role" value={role} onChange={event => setRole(event.target.value as typeof role)} className={styles.input}><option value="MEMBER">Contributor — view and record savings</option><option value="VIEWER">Viewer — view only</option></ValidatedSelect></label><p className="text-xs leading-5 text-gray-500">An in-app invitation expires after 7 days. The person must sign in with this verified email and accept. No email message is sent.</p><button disabled={busy} className={styles.primary}>Create invitation</button></ValidatedForm>;
}
function ContributionForm({ goal, busy, onContribute }: { goal: SharedGoal; busy: boolean; onContribute: (amount: number, note: string, key: string) => Promise<boolean> }) {
  const [amount, setAmount] = useState(''), [note, setNote] = useState('');
  const retry = useRef<{ payload: string; key: string } | null>(null);
  return <ValidatedForm className="mt-4 space-y-3 rounded-xl bg-gray-50 p-4" onSubmit={async event => {
    event.preventDefault();
    const payload = JSON.stringify({ goalId: goal.id, amount: Number(amount), note: note.trim() });
    if (retry.current?.payload !== payload) retry.current = { payload, key: crypto.randomUUID() };
    if (await onContribute(Number(amount), note.trim(), retry.current.key)) { retry.current = null; setAmount(''); setNote(''); }
  }}><label className="block text-xs font-semibold" htmlFor={`contribute-${goal.id}`}>Contribution (₱)<ValidatedInput id={`contribute-${goal.id}`} type="number" min="0.01" max="999999999999.99" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} required className={styles.input} /></label><label className="block text-xs font-semibold" htmlFor={`note-${goal.id}`}>Note (optional)<ValidatedInput id={`note-${goal.id}`} value={note} onChange={event => setNote(event.target.value)} maxLength={200} className={styles.input} /></label><button disabled={busy} className={styles.primary}>Record contribution</button></ValidatedForm>;
}
