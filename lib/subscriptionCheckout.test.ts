import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import apiClient from './apiClient';
import { subscriptionService } from '../services/subscriptionService';
import { clearSubscriptionCheckoutKey, subscriptionCheckoutKey } from './subscriptionCheckout';

function storage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}
test('checkout retries and refreshed pages retain the key, while accounts and new purchases are separate', () => {
  const saved = storage();
  const first = subscriptionCheckoutKey('first-user', 'paymongo_test:BASIC', saved);
  assert.equal(subscriptionCheckoutKey('first-user', 'paymongo_test:BASIC', { ...saved }), first);
  assert.notEqual(subscriptionCheckoutKey('second-user', 'paymongo_test:BASIC', saved), first);
  clearSubscriptionCheckoutKey('first-user', saved);
  assert.notEqual(subscriptionCheckoutKey('first-user', 'paymongo_test:BASIC', saved), first);
});
test('blocked browser storage still retains a retry key within the page', () => {
  const blocked = { getItem: () => { throw new Error('Blocked'); }, setItem: () => { throw new Error('Blocked'); }, removeItem: () => { throw new Error('Blocked'); } };
  const first = subscriptionCheckoutKey('blocked-user', 'paymongo:STANDARD', blocked);
  assert.equal(subscriptionCheckoutKey('blocked-user', 'paymongo:STANDARD', blocked), first);
  clearSubscriptionCheckoutKey('blocked-user', blocked);
  assert.notEqual(subscriptionCheckoutKey('blocked-user', 'paymongo:STANDARD', blocked), first);
});
test('a lost checkout response retries with exactly the same transmitted idempotency key', async () => {
  const original = apiClient.defaults.adapter;
  const keys: string[] = [];
  let calls = 0;
  apiClient.defaults.adapter = async config => {
    keys.push(String(config.headers['Idempotency-Key']));
    if (++calls === 1) throw new axios.AxiosError('Connection interrupted', 'ERR_NETWORK', config);
    return { data: { checkoutUrl: 'https://checkout.paymongo.com/same-checkout', testMode: true, subscription: {} }, status: 201, statusText: 'Created', headers: {}, config };
  };
  try {
    const saved = storage();
    const key = subscriptionCheckoutKey('retry-user', 'paymongo_test:PREMIUM', saved);
    await assert.rejects(subscriptionService.startTestCheckout('PREMIUM', key), /Connection interrupted/);
    await subscriptionService.startTestCheckout('PREMIUM', subscriptionCheckoutKey('retry-user', 'paymongo_test:PREMIUM', saved));
    assert.deepEqual(keys, [key, key]);
  } finally { apiClient.defaults.adapter = original; }
});
