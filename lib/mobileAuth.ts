const proofKey = 'casha_mobile_google_proof';
const proofLifetime = 10 * 60 * 1000;

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function startMobileGoogleSignIn(): Promise<void> {
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = base64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
  window.localStorage.setItem(proofKey, JSON.stringify({ verifier, createdAt: Date.now() }));
  const url = new URL(`${(process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')}/auth/google`);
  url.searchParams.set('client', 'android');
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  const { Browser } = await import('@capacitor/browser');
  try { await Browser.open({ url: url.toString() }); }
  catch (error) { window.localStorage.removeItem(proofKey); throw error; }
}

export function parseMobileGoogleCallback(raw: string): { code?: string; error?: string } | null {
  let url: URL;
  try { url = new URL(raw); } catch { return null; }
  if (url.protocol !== 'cashaba:' || url.hostname !== 'auth' || url.pathname !== '/google/callback'
    || url.username || url.password || url.port || url.hash) return null;
  if (url.searchParams.has('error')) return { error: 'Google sign-in was cancelled or could not be completed. Please try again.' };
  const code = url.searchParams.get('code');
  return code && /^[A-Za-z0-9_-]{43}$/.test(code) ? { code } : { error: 'The Google sign-in return was invalid. Please try again.' };
}

export function takeMobileGoogleProof(): string {
  const raw = window.localStorage.getItem(proofKey);
  window.localStorage.removeItem(proofKey);
  try {
    const proof = JSON.parse(raw || 'null');
    const age = Date.now() - proof.createdAt;
    if (typeof proof.verifier !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(proof.verifier)
      || typeof proof.createdAt !== 'number' || age < 0 || age > proofLifetime) throw new Error();
    return proof.verifier;
  } catch { throw new Error('Google sign-in expired. Please start again from the app.'); }
}
