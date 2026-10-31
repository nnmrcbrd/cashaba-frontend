"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";
import Sidebar from "@/app/components/ui/sidebar";
import { subscriptionService, planLabel, type PaidPlan, type SubscriptionSummary } from "@/services/subscriptionService";
import { clearSubscriptionCheckoutKey, subscriptionCheckoutKey } from "@/lib/subscriptionCheckout";
import { openExternalPage } from '@/lib/nativeBrowser';
import Link from 'next/link';
import { ValidatedInput } from '@/app/components/ui/ValidatedForm';

function errorMessage(error: unknown, fallback: string) {
  return axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || fallback : fallback;
}
const dateLabel = (value: string) => new Date(value).toLocaleDateString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric" });
const priceLabel = (cents: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(cents / 100);
function Usage({ label, used, limit }: { label: string; used: number; limit: number }) {
  return <div><div className="flex justify-between gap-4 text-xs"><span>{label}</span><strong>{used} / {limit}</strong></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full bg-emerald-600" style={{ width: `${limit > 0 ? Math.min(100, used / limit * 100) : 0}%` }} /></div></div>;
}

export default function SubscriptionPage() {
  const [data, setData] = useState<SubscriptionSummary | null>(null);
  const [message, setMessage] = useState("");
  const [dismissedMessage, setDismissedMessage] = useState("");
  const [billingNoticeDismissed, setBillingNoticeDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState('');
  const requestInFlight = useRef(false);
  const liveCheckoutEnabled = data?.billingMode === "paymongo" && process.env.NEXT_PUBLIC_PAYMONGO_SUBSCRIPTIONS_ENABLED === "true";

  function update(summary: SubscriptionSummary) {
    if (summary.accessStatus === "ACTIVE" || summary.status === "CANCELLED" || summary.status === "EXPIRED") clearSubscriptionCheckoutKey(summary.userId);
    setData(summary);
    window.dispatchEvent(new Event("casha-subscription-changed"));
  }
  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const result = new URLSearchParams(window.location.search).get("payment");
    async function load() {
      try {
        const summary = await subscriptionService.getMine();
        if (!mounted) return;
        if (summary.accessStatus === "ACTIVE" || summary.status === "CANCELLED" || summary.status === "EXPIRED") clearSubscriptionCheckoutKey(summary.userId);
        setData(summary);
        if (summary.checkoutVerificationError) setMessage(summary.checkoutVerificationError);
        else if (result === "success" && summary.accessStatus === "ACTIVE") setMessage(`${summary.planName} payment verified.${summary.provider === "PAYMONGO_TEST" ? " No real money was charged." : ""}`);
        else if (result === "success" && summary.paymentPending) {
          setMessage(attempts < 10 ? "Waiting for PayMongo to confirm payment…" : "Payment is not confirmed yet. Use Check payment status to try again.");
          if (attempts++ < 10 && summary.testCheckoutAvailable) timer = setTimeout(() => void load(), 2000);
        } else if (result === "cancelled") setMessage("Checkout was closed. Your paid plan activates only after verified payment.");
      } catch { if (mounted) setMessage("Unable to load your plan. Refresh this page to try again."); }
    }
    void load();
    const refresh = () => { clearTimeout(timer); void load(); };
    window.addEventListener("focus", refresh);
    return () => { mounted = false; clearTimeout(timer); window.removeEventListener("focus", refresh); };
  }, []);

  async function act(action: () => Promise<SubscriptionSummary>, success: string) {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setBusy(true); setMessage(""); setDismissedMessage("");
    try { update(await action()); setMessage(success); }
    catch (error) { setMessage(errorMessage(error, "The plan change could not be completed.")); }
    finally { requestInFlight.current = false; setBusy(false); }
  }
  async function selectPlan(plan: PaidPlan) {
    if (!data || requestInFlight.current) return;
    requestInFlight.current = true;
    setBusy(true); setMessage(""); setDismissedMessage("");
    try {
      const key = subscriptionCheckoutKey(data.userId, `${data.billingMode}:${plan}`);
      if (data.demoAvailable) {
        update(await subscriptionService.activateDemo(plan, key));
        setMessage(`${planLabel(plan)} demo activated for 30 days. No payment was collected.`);
      } else if (data.testCheckoutAvailable) {
        const result = await subscriptionService.startTestCheckout(plan, key);
        const url = new URL(result.checkoutUrl);
        if (result.testMode !== true || url.protocol !== "https:" || url.hostname !== "checkout.paymongo.com") throw new Error("Invalid checkout URL");
        update(result.subscription);
        await openExternalPage(url.toString());
      } else if (liveCheckoutEnabled) {
        const normalized = phone.trim().replace(/[\s()-]/g, "").replace(/^09/, "+639");
        if (!/^\+639\d{9}$/.test(normalized)) { setPhoneError("Enter a valid Philippine mobile number, such as 09171234567."); return; }
        const result = await subscriptionService.startPayMongo(normalized, plan, key);
        update(result.subscription);
        setMessage(result.message);
        if (result.authorizationUrl) {
          const url = new URL(result.authorizationUrl);
          if (url.protocol !== "https:" || !(url.hostname === "paymongo.com" || url.hostname.endsWith(".paymongo.com"))) throw new Error("Invalid authorization URL");
          await openExternalPage(url.toString());
        }
      } else setMessage("Checkout is not configured yet. Please contact the administrator.");
    } catch (error) {
      if (axios.isAxiosError(error) && [400, 401, 403, 404, 422].includes(error.response?.status ?? 0)) clearSubscriptionCheckoutKey(data.userId);
      setMessage(errorMessage(error, "The checkout response was interrupted. Refresh payment status before retrying; your original checkout will be reused."));
      try { setData(await subscriptionService.getMine()); } catch { /* Retain the original key and error. */ }
    }
    finally { requestInFlight.current = false; setBusy(false); }
  }
  async function checkPayment() {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setBusy(true); setMessage(""); setDismissedMessage("");
    try {
      const summary = await subscriptionService.verifyTestCheckout();
      update(summary);
      setMessage(summary.accessStatus === "ACTIVE" ? `${summary.planName} payment verified. No real money was charged.` : "PayMongo has not confirmed a successful test payment yet.");
    } catch (error) { setMessage(errorMessage(error, "Unable to verify payment.")); }
    finally { requestInFlight.current = false; setBusy(false); }
  }
  const paid = data?.accessStatus === "ACTIVE";
  const testPending = data?.provider === "PAYMONGO_TEST" && data.paymentPending;
  const checkoutUnconfirmed = data?.checkoutState === "PROCESSING" || data?.checkoutState === "UNCERTAIN";
  const canCheckout = data && !paid && !checkoutUnconfirmed && !data.providerActionRequired && (data.demoAvailable || data.testCheckoutAvailable || liveCheckoutEnabled);

  return <div className="flex min-h-screen bg-[#f7f9f8]"><Sidebar /><main className="app-main max-w-6xl">
    <header className="app-page-header mb-7 border-b border-gray-200 pb-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Plans &amp; usage</p><h1>Casha-Ba Pro</h1>
      <p className="mt-2 text-sm text-gray-500">Start with a 14-day free trial. Continue with Basic, Standard or Pro.</p>
    </header>
    {message && message !== dismissedMessage && <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><p role="status" className="min-w-0 flex-1">{message}</p><button type="button" aria-label="Dismiss checkout notification" onClick={() => setDismissedMessage(message)} className="-m-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"><X className="h-4 w-4" aria-hidden="true" /></button></div>}
    {checkoutUnconfirmed && <div role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p>Your first checkout is processing or its result is unconfirmed. A second checkout is blocked to avoid another payment. If the status stays unconfirmed, contact support.</p><button type="button" disabled={busy} onClick={() => void act(subscriptionService.getMine, "Payment status refreshed.")} className="mt-2 rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold disabled:opacity-50">Refresh payment status</button></div>}
    {data && !billingNoticeDismissed && <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-5 text-emerald-800"><p className="min-w-0 flex-1">{data.billingMode === "paymongo_test" ? "PayMongo test payments only. No real money is collected and there is no automatic renewal. Verified payment activates your selected plan for 30 days." : data.demoAvailable || data.provider === "DEMO" ? "Demo billing. No real payment is collected. Demo plans last 30 days." : "Paid access activates after PayMongo confirms payment. Recurring plans bill monthly until cancelled."}</p><button type="button" aria-label="Dismiss billing information" onClick={() => setBillingNoticeDismissed(true)} className="-m-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"><X className="h-4 w-4" aria-hidden="true" /></button></div>}
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold text-gray-500">CURRENT ACCESS</p><h2 className="mt-0.5 text-xl font-extrabold">{data?.planName ?? "Loading…"}</h2>
        {data?.accessStatus === "TRIAL" && <p className="mt-1 text-xs text-emerald-700">{data.trialDaysRemaining} {data.trialDaysRemaining === 1 ? "day" : "days"} left · Ends {dateLabel(data.trialEndsAt)}</p>}
        {data?.accessStatus === "EXPIRED" && <p className="mt-1 max-w-xl text-xs leading-5 text-amber-800">Your trial has ended. Choose a plan to add or edit financial records, use AI, or scan receipts. Your existing records remain available to view and export.</p>}
        {paid && data && <p className="mt-1 text-xs text-emerald-700">Access until {dateLabel(data.currentPeriodEnd)} · {data.provider === "PAYMONGO_TEST" ? "Test payment" : data.provider === "DEMO" ? "Demo" : "Paid subscription"}</p>}
      </div><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">{data?.paymentPending ? "Payment pending" : data?.accessStatus ?? "Loading"}</span></div>
      {data && <div className="mt-4 grid gap-4 sm:grid-cols-2"><Usage label="AI requests this month" used={data.used.aiRequests} limit={data.limits.aiRequests} /><Usage label="Receipt and GCash scans this month" used={data.used.receiptScans} limit={data.limits.receiptScans} /></div>}
      {data?.accessStatus === "TRIAL" && <p className="mt-3 text-xs text-gray-500">Trial includes money tracking, budgets, bills, debts, personal and shared goals, plus 10 AI requests and 5 scans within the current usage month. No automatic paid enrollment.</p>}
      {data?.canShareSavings && <Link href="/shared-savings" className="mt-3 inline-block text-sm font-semibold text-emerald-700 underline">Open shared savings profiles</Link>}
      {paid && <div className="mt-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3"><button type="button" disabled={busy} onClick={() => void act(subscriptionService.cancel, "Subscription cancelled. Access follows your original trial expiry; the trial does not restart.")} className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold disabled:opacity-50">Cancel current plan</button><p className="text-[11px] leading-4 text-gray-500">Cancellation ends paid access immediately and stops future billing. You can choose another plan after cancellation.</p></div>}
    </section>
    {data?.providerActionRequired && <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="text-sm">Cancel your earlier recurring PayMongo subscription before opening a new checkout.</p><button type="button" disabled={busy} onClick={() => void act(subscriptionService.cancel, "Earlier subscription cancelled.")} className="mt-3 rounded-xl border border-amber-300 px-4 py-2 text-sm font-bold">Cancel earlier subscription</button></section>}
    {testPending && data && <section className="mb-6 rounded-2xl border border-emerald-200 bg-white p-5"><h2 className="font-bold">Pending {planLabel(data.requestedPlan ?? "PLUS")} test checkout</h2><p className="mt-1 text-sm text-gray-500">{priceLabel(data.checkoutAmountCents ?? 9900)} · No real charge</p><div className="mt-4 flex flex-wrap gap-3">
      {data.requestedPlan && data.requestedPlan !== "FREE" && data.requestedPlan !== "PLUS" && <button type="button" disabled={busy} onClick={() => void selectPlan(data.requestedPlan as PaidPlan)} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Continue test checkout</button>}
      <button type="button" disabled={busy} onClick={() => void checkPayment()} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold">Check payment status</button><button type="button" disabled={busy} onClick={() => void act(subscriptionService.cancel, "Test checkout cancelled.")} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold">Cancel checkout</button></div></section>}
    {liveCheckoutEnabled && !paid && <div className="mb-5 max-w-md"><label htmlFor="paymongo-phone" className="mb-2 block text-sm font-semibold">Mobile number for PayMongo</label><ValidatedInput id="paymongo-phone" type="tel" autoComplete="tel" value={phone} error={phoneError} onChange={event => { setPhone(event.target.value); setPhoneError(''); }} validate={value => !/^\+639\d{9}$/.test(value.trim().replace(/[\s()-]/g, '').replace(/^09/, '+639')) ? 'Enter a Philippine mobile number, such as 09171234567.' : ''} required placeholder="09171234567" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3" /></div>}
    <h2 className="mb-4 text-lg font-bold">Choose your plan</h2>
    {!data ? <p className="text-sm text-gray-500">Loading plans…</p> : <div className="grid gap-5 lg:grid-cols-3">{data.plans.map(plan => <section key={plan.id} className={`flex flex-col rounded-3xl border p-6 ${plan.id === "STANDARD" ? "border-emerald-800 bg-[#073f30] text-white" : "border-gray-200 bg-white"}`}>
      <h3 className="text-lg font-bold">{plan.name}</h3><p className="mt-4"><strong className="text-4xl font-extrabold">{priceLabel(plan.priceCents)}</strong><span className="ml-2 text-xs opacity-70">per month</span></p>
      <ul className="mt-6 flex-1 space-y-3 text-sm"><li>✓ {plan.aiRequests} AI requests per month</li><li>✓ {plan.receiptScans} receipt or GCash scans per month</li><li>✓ AI financial insight cards</li><li>✓ Wallets and transaction history</li><li>✓ Budgets, bills, debts and goals</li><li>✓ Reports and data export</li>{plan.sharedSavings && <li>✓ Shared savings: 5 profiles, 10 members each, invitations and contribution history</li>}</ul>
      <button type="button" disabled={busy || !canCheckout} onClick={() => void selectPlan(plan.id)} className={`mt-7 w-full rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50 ${plan.id === "STANDARD" ? "bg-emerald-300 text-[#073f30]" : "bg-emerald-700 text-white"}`}>{busy ? "Please wait…" : data.plan === plan.id ? "Current plan" : paid ? "Cancel current plan to switch" : data.demoAvailable ? `Activate ${plan.name} demo` : data.testCheckoutAvailable ? `Choose ${plan.name} · test checkout` : liveCheckoutEnabled ? `Subscribe to ${plan.name}` : "Checkout unavailable"}</button>
    </section>)}</div>}
    {data?.billingMode === "paymongo_test" && !data.testCheckoutAvailable && <p className="mt-4 text-sm text-amber-800">Test checkout needs a configured PayMongo secret test key.</p>}
    <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6"><h2 className="text-lg font-bold">After your trial</h2><p className="mt-2 text-sm leading-6 text-gray-600">The free trial lasts 14 days from account creation. After it ends, Basic, Standard or Pro is required for adding and editing personal records, AI requests and scanning. Pro also lets you own shared savings profiles. Invited members do not need their own paid plan; the owner’s access covers the profile. Viewing and exporting your existing records remains available.</p><p className="mt-3 text-xs leading-5 text-gray-500">Usage resets at the start of each calendar month. Changing or cancelling a plan does not reset usage or restart the trial. Shared profiles become read-only if the owner’s Pro access and trial expire. Removing members and revoking invitations remain available to the owner. AI features also depend on provider availability.</p></section>
  </main></div>;
}
