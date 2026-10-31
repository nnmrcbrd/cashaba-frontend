'use client';

import { useEffect } from 'react';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { useRouter } from 'next/navigation';
import apiClient, { setApiAccessToken } from '@/lib/apiClient';
import { parseMobileGoogleCallback, takeMobileGoogleProof } from '@/lib/mobileAuth';

export default function NativeRuntime() {
  const router = useRouter();
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;
    const listeners: PluginListenerHandle[] = [];
    const handled = new Set<string>();
    document.documentElement.dataset.nativePlatform = Capacitor.getPlatform();
    const retain = (listener: PluginListenerHandle) => {
      if (active) listeners.push(listener);
      else void listener.remove();
    };
    async function handleUrl(raw: string) {
      const callback = parseMobileGoogleCallback(raw);
      if (!active || !callback || handled.has(raw)) return;
      // Android keeps the launch Intent across WebView reloads. Do not redeem
      // the already-consumed code again after restarting AuthProvider.
      if (callback.code && window.localStorage.getItem('casha_mobile_google_completed') === callback.code) return;
      handled.add(raw);
      try {
        const { Browser } = await import('@capacitor/browser');
        await Browser.close().catch(() => undefined);
        if (callback.error || !callback.code) {
          try { takeMobileGoogleProof(); } catch { /* Discard expired proof. */ }
          throw new Error(callback.error || 'Google sign-in failed.');
        }
        const verifier = takeMobileGoogleProof();
        const response = await apiClient.post('/auth/google/mobile-exchange', { code: callback.code, verifier });
        if (typeof response.data.accessToken !== 'string' || !response.data.accessToken) throw new Error('Google sign-in failed.');
        setApiAccessToken(response.data.accessToken);
        window.localStorage.setItem('casha_last_activity', String(Date.now()));
        window.localStorage.setItem('casha_mobile_google_completed', callback.code);
        // Reload AuthProvider from Android's HttpOnly cookie jar. The native
        // route client resolves this path to its bundled Next HTML document.
        if (active) window.location.replace('/auth/google/callback/');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Google sign-in could not be completed.';
        if (active) router.replace(`/auth/google/callback/?error=${encodeURIComponent(message)}`);
      }
    }
    async function initialize() {
      const { App } = await import('@capacitor/app');
      if (!active) return;
      retain(await App.addListener('appUrlOpen', ({ url }) => { void handleUrl(url); }));
      retain(await App.addListener('appStateChange', ({ isActive }) => {
        if (active && isActive) window.dispatchEvent(new Event('focus'));
      }));
      retain(await App.addListener('backButton', ({ canGoBack }) => {
        if (!active) return;
        const path = window.location.pathname.replace(/\/$/, '') || '/';
        if (['/', '/login', '/dashboard', '/admin/manage-users'].includes(path)) void App.minimizeApp();
        else if (canGoBack) window.history.back();
        else router.replace('/dashboard/');
      }));
      const launch = await App.getLaunchUrl();
      if (active && launch?.url) await handleUrl(launch.url);
    }
    void initialize().catch(error => console.error('Native app initialization failed', error));
    return () => {
      active = false;
      listeners.forEach(listener => { void listener.remove(); });
      delete document.documentElement.dataset.nativePlatform;
    };
  }, [router]);
  return null;
}
