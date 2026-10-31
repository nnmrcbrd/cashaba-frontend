import { Capacitor } from '@capacitor/core';

export async function openExternalPage(url: string): Promise<void> {
  const destination = new URL(url);
  if (destination.protocol !== 'https:' || destination.username || destination.password) throw new Error('Invalid external URL.');
  if (Capacitor.isNativePlatform()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url: destination.toString() });
  } else {
    window.location.assign(destination.toString());
  }
}
