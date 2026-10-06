"use client";

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import axios from 'axios';
import EmailOtpFlow from '@/app/components/auth/EmailOtpForm';

function VerifyEmail() {
  const params = useSearchParams();
  const [message, setMessage] = useState('Confirm your email address to activate your account.');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function verify() {
    setBusy(true);
    try {
      const result = await apiClient.get('/auth/verify', { params: { token: params.get('token') } });
      setMessage(result.data.message); setDone(true);
    } catch (error) {
      setMessage(axios.isAxiosError(error) ? error.response?.data?.message || 'Unable to verify this link.' : 'Unable to verify this link.');
    } finally { setBusy(false); }
  }
  if (!params.get('token')) return <EmailOtpFlow purpose="verification" />;
  return <main className="mx-auto max-w-lg space-y-5 p-8"><h1 className="text-2xl font-bold">Verify your email</h1><p role="status">{message}</p>{!done && <button disabled={busy} onClick={() => void verify()} className="rounded-xl bg-emerald-700 px-5 py-3 text-white disabled:opacity-50">{busy ? 'Verifying…' : 'Verify email'}</button>}<p><a href="/login" className="underline">Sign in</a> · <a href="/verify-email" className="underline">Request a verification code</a></p></main>;
}
export default function Page() { return <Suspense fallback={<p>Loading…</p>}><VerifyEmail /></Suspense>; }
