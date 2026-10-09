type CheckoutStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const fallback = new Map<string, string>();
function browserStorage() {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; }
  catch { return undefined; }
}
// A lost response or page refresh retains the logical checkout's retry key.
// The backend also protects concurrent requests from other tabs and devices.
export function subscriptionCheckoutKey(userId: string, selection: string, storage: CheckoutStorage | undefined = browserStorage()) {
  const slot = `casha:subscription-checkout:${userId}`;
  let saved = fallback.get(slot);
  try { saved = storage?.getItem(slot) ?? saved; } catch { /* Storage may be disabled. */ }
  if (saved) {
    try {
      const entry = JSON.parse(saved) as { selection?: string; key?: string };
      if (entry.selection === selection && typeof entry.key === 'string' && /^[a-zA-Z0-9:_-]{8,160}$/.test(entry.key)) return entry.key;
    } catch { /* Server reservations still protect invalid local entries. */ }
  }
  const key = crypto.randomUUID();
  const entry = JSON.stringify({ selection, key });
  fallback.set(slot, entry);
  try { storage?.setItem(slot, entry); } catch { /* Retain the in-memory retry key. */ }
  return key;
}
export function clearSubscriptionCheckoutKey(userId: string, storage: CheckoutStorage | undefined = browserStorage()) {
  const slot = `casha:subscription-checkout:${userId}`;
  fallback.delete(slot);
  try { storage?.removeItem(slot); } catch { /* The backend remains authoritative. */ }
}
