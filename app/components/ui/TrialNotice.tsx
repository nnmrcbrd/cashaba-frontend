"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/Authcontext';
import { subscriptionService, type SubscriptionSummary } from '@/services/subscriptionService';

export default function TrialNotice() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const data = await subscriptionService.getMine();
        if (!mounted) return;
        setSummary(data);
        clearTimeout(timer);
        const end = data.accessStatus === 'ACTIVE' ? data.currentPeriodEnd : data.trialEndsAt;
        const remaining = new Date(end).getTime() - Date.now();
        if (remaining > 0) timer = setTimeout(() => void load(), Math.min(remaining + 1000, 86_400_000));
      } catch { /* The page retains its own request error and retry controls. */ }
    };
    const refresh = () => void load();
    void load();
    window.addEventListener('focus', refresh);
    window.addEventListener('casha-subscription-changed', refresh);
    window.addEventListener('casha-trial-expired', refresh);
    return () => {
      mounted = false; clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('casha-subscription-changed', refresh);
      window.removeEventListener('casha-trial-expired', refresh);
    };
  }, [user]);
  if (!summary || summary.accessStatus === 'ACTIVE') return null;
  return <div className="casha-sidebar__copy mx-3 mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
    <p className="font-bold">{summary.accessStatus === 'TRIAL' ? `Free trial · ${summary.trialDaysRemaining} days left` : 'Your free trial has ended'}</p>
    <p className="mt-1 leading-4">{summary.canWrite ? 'Choose a plan to continue after 14 days.' : 'View and export are available. Subscribe to add or edit.'}</p>
    <Link href="/subscription" className="mt-2 inline-block font-bold underline underline-offset-2">View plans</Link>
  </div>;
}
