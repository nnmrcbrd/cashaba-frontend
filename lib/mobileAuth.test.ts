import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMobileGoogleCallback, takeMobileGoogleProof } from './mobileAuth';

test('native login accepts only the exact app callback and a valid opaque code', () => {
  const code = 'a'.repeat(43);
  assert.deepEqual(parseMobileGoogleCallback(`cashaba://auth/google/callback?code=${code}`), { code });
  for (const raw of ['not a URL', `https://auth/google/callback?code=${code}`, `cashaba://evil/google/callback?code=${code}`,
    `cashaba://auth.evil/google/callback?code=${code}`, `cashaba://auth/wrong?code=${code}`,
    `cashaba://user:password@auth/google/callback?code=${code}`, `cashaba://auth/google/callback?code=${code}#fragment`]) {
    assert.equal(parseMobileGoogleCallback(raw), null);
  }
  assert.ok(parseMobileGoogleCallback('cashaba://auth/google/callback?code=bad')?.error);
  assert.ok(parseMobileGoogleCallback('cashaba://auth/google/callback?error=cancelled')?.error);
});

test('native login proof is short-lived and removed before exchange', () => {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    removeItem: (key: string) => { storage.delete(key); },
  } } });
  const key = 'casha_mobile_google_proof';
  try {
    storage.set(key, JSON.stringify({ verifier: 'a'.repeat(43), createdAt: Date.now() }));
    assert.equal(takeMobileGoogleProof(), 'a'.repeat(43));
    assert.throws(takeMobileGoogleProof);
    for (const proof of ['not-json', JSON.stringify({ verifier: 'a'.repeat(43), createdAt: Date.now() - 11 * 60_000 }),
      JSON.stringify({ verifier: 'a'.repeat(43), createdAt: Date.now() + 60_000 }), JSON.stringify({ verifier: 'short', createdAt: Date.now() })]) {
      storage.set(key, proof);
      assert.throws(takeMobileGoogleProof);
      assert.equal(storage.has(key), false);
    }
  } finally {
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
