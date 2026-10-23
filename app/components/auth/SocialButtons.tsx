"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Capacitor } from '@capacitor/core';
import { startMobileGoogleSignIn } from '@/lib/mobileAuth';

type Provider = "google";
const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

const PROVIDERS: Array<{
  id: Provider;
  label: string;
  url?: string;
}> = [
  {
    id: "google",
    label: "Continue with Google",
    url: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_URL || `${apiBaseUrl}/auth/google`,
  },

];

export default function SocialButtons() {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const [error, setError] = useState('');

  async function continueWith(provider: (typeof PROVIDERS)[number]) {
    if (!provider.url || loadingProvider) return;
    setLoadingProvider(provider.id);
    setError('');
    if (Capacitor.isNativePlatform()) {
      try { await startMobileGoogleSignIn(); }
      catch { setError('Google sign-in could not be opened. Please try again.'); }
      finally { setLoadingProvider(null); }
    } else window.location.assign(provider.url);
  }

  return (
    <div>
      <div className="grid gap-3">
        {PROVIDERS.map((provider) => {
          const loading = loadingProvider === provider.id;
          const enabled = Boolean(provider.url) && !loadingProvider;
          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => continueWith(provider)}
              disabled={!enabled}
              title={provider.url ? provider.label : `${provider.label} requires OAuth configuration`}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            >
              {loading ? (
                <LoaderCircle className="animate-spin" size={17} />
              ) : (
                <GoogleIcon />
              )}
              {provider.label}
            </button>
          );
        })}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Or continue with email</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]">
      <path fill="#4285F4" d="M21.35 12.2c0-.64-.06-1.26-.16-1.85H12v3.5h5.25a4.49 4.49 0 0 1-1.95 2.94v2.27h3.16c1.85-1.7 2.89-4.22 2.89-6.86Z" />
      <path fill="#34A853" d="M12 21.73c2.64 0 4.86-.88 6.48-2.38l-3.16-2.27c-.88.59-2 .94-3.32.94-2.55 0-4.71-1.72-5.48-4.03H3.26v2.34A9.79 9.79 0 0 0 12 21.73Z" />
      <path fill="#FBBC05" d="M6.52 13.99A5.9 5.9 0 0 1 6.21 12c0-.69.12-1.36.31-1.99V7.67H3.26A9.76 9.76 0 0 0 2.21 12c0 1.56.37 3.04 1.05 4.33l3.26-2.34Z" />
      <path fill="#EA4335" d="M12 5.98c1.44 0 2.72.49 3.73 1.46l2.8-2.8A9.4 9.4 0 0 0 12 2.27a9.79 9.79 0 0 0-8.74 5.4l3.26 2.34C7.29 7.7 9.45 5.98 12 5.98Z" />
    </svg>
  );
}
