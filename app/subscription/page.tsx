"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "@/app/components/ui/sidebar";
import { subscriptionService, type SubscriptionSummary } from "@/services/subscriptionService";

const FEATURES = [
  ["Monthly price", "₱0", "₱99 (test: no real charge)"],
  ["AI coach requests per month", "10", "200"],
  ["Receipt and GCash scans per month", "5", "100"],
  ["Financial insight cards", "Rule-based insights", "AI-personalized insights when AI service is available"],
  ["Wallets and manual transactions", "Included", "Included"],
  ["Safe-to-Spend and budgets", "Included", "Included"],
  ["Savings goals, debts and loans", "Included", "Included"],
  ["Search and CSV import", "Included", "Included"],
  ["Spreadsheet and PDF reports", "Included", "Included"],
  ["Usage dashboard and period tracking", "Included", "Included"],
];

function errorMessage(error: unknown, fallback: string) {
  return axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || fallback : fallback;
}

function Usage({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percentage = Math.min(100, Math.round((used / limit) * 100));
  return <div><div className="flex justify-between gap-4 text-xs"><span>{label}</span><strong>{used} / {limit}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full bg-emerald-600" style={{ width: percentage + "%" }} /></div></div>;
}

export default function SubscriptionPage() {
  const [data, setData] = useState<SubscriptionSummary | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState("");
  const testPlusActive = data?.plan === "PLUS" && data.provider === "PAYMONGO_TEST";
  const demoPlusActive = data?.plan === "PLUS" && !["PAYMONGO", "PAYMONGO_TEST"].includes(data.provider);
  const testPending = data?.provider === "PAYMONGO_TEST" && data.paymentPending;
  const testBilling = data?.billingMode === "paymongo_test";
  const liveCheckoutEnabled = data?.billingMode === "paymongo" && process.env.NEXT_PUBLIC_PAYMONGO_SUBSCRIPTIONS_ENABLED === "true";

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const result = new URLSearchParams(window.location.search).get("payment");
    async function load() {
      try {
        const summary = await subscriptionService.getMine();
        if (!mounted) return;
        setData(summary);
        if (summary.checkoutVerificationError) setMessage(summary.checkoutVerificationError);
        else if (result === "success" && summary.plan === "PLUS" && summary.provider === "PAYMONGO_TEST") setMessage("Test payment verified. Casha-Ba Plus is active for 30 days. No real money was charged.");
        else if (result === "success" && summary.paymentPending && summary.provider === "PAYMONGO_TEST") {
          setMessage(attempts < 10 ? "Waiting for PayMongo to confirm your test payment…" : "Payment has not been confirmed yet. Use Check payment status to try again.");
          if (attempts++ < 10 && summary.testCheckoutAvailable) { clearTimeout(timer); timer = setTimeout(() => void load(), 2000); }
        } else if (result === "cancelled") setMessage(summary.plan === "PLUS" ? "Your test payment is verified and Plus is active." : "Checkout was closed. Plus activates only after a verified test payment. You can continue your checkout below.");
      } catch { if (mounted) setMessage("Unable to load your plan. Refresh this page to try again."); }
    }
    void load();
    const refresh = () => void load();
    window.addEventListener("focus", refresh);
    return () => { mounted = false; clearTimeout(timer); window.removeEventListener("focus", refresh); };
  }, []);

  async function act(action: () => Promise<SubscriptionSummary>, success: string) {
    setBusy(true); setMessage("");
    try { setData(await action()); setMessage(success); }
    catch (error) { setMessage(errorMessage(error, "The plan change could not be completed.")); }
    finally { setBusy(false); }
  }

  async function openTestCheckout() {
    setBusy(true); setMessage("");
    try {
      const result = await subscriptionService.startTestCheckout();
      const url = new URL(result.checkoutUrl);
      if (result.testMode !== true || url.protocol !== "https:" || url.hostname !== "checkout.paymongo.com") throw new Error("Invalid test checkout");
      setData(result.subscription);
      window.location.assign(url.toString());
    } catch (error) { setMessage(errorMessage(error, "PayMongo test checkout could not be opened.")); }
    finally { setBusy(false); }
  }

  async function checkPayment() {
    setBusy(true); setMessage("");
    try {
      const summary = await subscriptionService.verifyTestCheckout();
      setData(summary);
      setMessage(summary.plan === "PLUS" ? "Test payment verified. Plus is active. No real money was charged." : "PayMongo has not confirmed a successful test payment yet. You can continue checkout or check again.");
    } catch (error) { setMessage(errorMessage(error, "Unable to verify the test payment.")); }
    finally { setBusy(false); }
  }

  async function subscribe() {
    if (!liveCheckoutEnabled) return;
    setBusy(true); setMessage("");
    try {
      const normalizedPhone = phone.trim().replace(/[\s()-]/g, "").replace(/^09/, "+639");
      if (!/^\+639\d{9}$/.test(normalizedPhone)) { setMessage("Enter a valid Philippine mobile number, such as 09171234567."); return; }
      const result = await subscriptionService.startPayMongo(normalizedPhone);
      setData(result.subscription);
      if (result.authorizationUrl) window.location.assign(result.authorizationUrl);
      else setMessage(result.message);
    } catch (error) { setMessage(errorMessage(error, "PayMongo could not start the subscription.")); }
    finally { setBusy(false); }
  }

  let notice = "Payment checkout is unavailable in this environment.";
  if (testBilling || testPlusActive) notice = "PayMongo test payments only. No real money is collected and there is no automatic renewal. " + (testPlusActive ? "Plus expires on " + new Date(data!.currentPeriodEnd).toLocaleDateString("en-PH") + "." : "After a successful test payment, you will return here and receive 30 days of Plus.");
  else if (demoPlusActive) notice = "Demo access remains active until " + new Date(data!.currentPeriodEnd).toLocaleDateString("en-PH") + ". No payment was collected.";
  else if (data?.billingMode === "paymongo") notice = "Plus activates after PayMongo confirms payment.";

  return <div className="flex min-h-screen bg-[#f7f9f8]"><Sidebar /><main className="app-main max-w-6xl">
    <header className="app-page-header mb-7 border-b border-gray-200 pb-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Plans &amp; usage</p>
      <h1>Casha-Ba Plus</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-500">Core money tracking stays free. Plus expands your AI coach and receipt scanning limits.</p>
      {data && <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">{notice}</p>}
    </header>
    {message && <p role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{message}</p>}
    {data?.providerActionRequired && <section className="mb-5 rounded-3xl border border-amber-200 bg-white p-6"><h2 className="text-xl font-bold">Earlier PayMongo subscription needs review</h2><p className="mt-2 text-sm text-gray-600">Cancel the earlier recurring subscription before starting another checkout.</p><button disabled={busy} onClick={() => void act(subscriptionService.cancel, "Earlier PayMongo subscription cancelled.")} className="mt-4 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Cancel earlier subscription</button></section>}
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-3xl border border-gray-200 bg-white p-6">
        <div className="flex justify-between gap-4"><div><p className="text-xs font-bold text-gray-500">CURRENT ACCESS</p><h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">{!data ? "Loading…" : demoPlusActive ? "Capstone Demo Plus" : data.plan === "PLUS" ? "Casha-Ba Plus" : "Free"}</h2>{(demoPlusActive || testPlusActive) && <p className="mt-1 text-xs font-semibold text-emerald-700">{testPlusActive ? "Test payment verified · no real charge" : "No payment collected"}</p>}</div><span className="h-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">{testPending ? "Payment pending" : data?.status ?? "Loading"}</span></div>
        <div className="mt-7 space-y-5">{data && <><Usage label="AI coach requests this month" used={data.used.aiRequests} limit={data.limits.aiRequests} /><Usage label="Receipt and GCash scans this month" used={data.used.receiptScans} limit={data.limits.receiptScans} /></>}</div>
        {data?.cancelAtPeriodEnd && <p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Access stays active until {new Date(data.currentPeriodEnd).toLocaleDateString("en-PH")}, then returns to Free.</p>}
      </section>
      <section className="rounded-3xl bg-[#073f30] p-6 text-white">
        <p className="text-xs font-bold text-emerald-200">{demoPlusActive ? "CAPSTONE DEMO ACCESS" : testBilling || testPlusActive ? "CASHA-BA PLUS · TEST CHECKOUT" : "CASHA-BA PLUS"}</p>
        {demoPlusActive ? <><h2 className="mt-2 text-3xl font-extrabold">No payment</h2><p className="mt-2 text-sm leading-6 text-emerald-100/75">Temporary Plus access for your capstone demonstration.</p></> : <div className="mt-2 flex items-end gap-2"><strong className="text-4xl">₱99</strong><span className="pb-1 text-sm text-emerald-100/70">{testBilling || testPlusActive ? "for 30 days · test only" : "per month"}</span></div>}
        <ul className="mt-6 space-y-3 text-sm text-emerald-50"><li>✓ 200 AI coach requests each month</li><li>✓ 100 receipt or GCash scans each month</li><li>✓ Personalized AI financial insight cards</li><li>✓ All Free tracking and export features</li></ul>
        {data?.plan === "FREE" && !data.providerActionRequired && data.testCheckoutAvailable && <button disabled={busy} onClick={() => void openTestCheckout()} className="mt-7 w-full rounded-xl bg-emerald-300 py-3 text-sm font-extrabold text-[#073f30] disabled:opacity-50">{busy ? "Connecting to PayMongo…" : testPending ? "Continue PayMongo test checkout" : "Purchase Plus — PayMongo test payment"}</button>}
        {testBilling && data?.testCheckoutAvailable && data.plan === "FREE" && <p className="mt-3 text-xs leading-5 text-emerald-100/80">For a test card payment, use 4343 4343 4343 4345, a future expiry date, and CVC 123. Use fictional billing details. GCash and Maya use a test authorization screen.</p>}
        {testPending && <div className="mt-3 flex flex-wrap gap-3"><button disabled={busy} onClick={() => void checkPayment()} className="rounded-xl border border-white/25 px-4 py-2 text-xs font-bold disabled:opacity-50">Check payment status</button><button disabled={busy} onClick={() => void act(subscriptionService.cancel, "Test checkout cancelled. Your plan remains Free.")} className="rounded-xl border border-white/25 px-4 py-2 text-xs font-bold disabled:opacity-50">Cancel test checkout</button></div>}
        {testBilling && !data?.testCheckoutAvailable && <p className="mt-4 text-xs text-amber-200">Test checkout needs a configured PayMongo secret test key.</p>}
        {data?.plan === "FREE" && !data.providerActionRequired && liveCheckoutEnabled && <div className="mt-7"><label htmlFor="paymongo-phone" className="mb-1.5 block text-xs font-bold text-emerald-100">Mobile number for PayMongo</label><input id="paymongo-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09171234567" className="w-full rounded-xl border border-white/20 bg-white px-3 py-3 text-sm text-slate-950 outline-none focus:ring-2 focus:ring-emerald-300" /><button disabled={busy} onClick={() => void subscribe()} className="mt-3 w-full rounded-xl bg-emerald-300 py-3 text-sm font-extrabold text-[#073f30] disabled:opacity-50">Subscribe with PayMongo</button></div>}
        {data?.plan === "FREE" && !data.providerActionRequired && data.demoAvailable && <button disabled={busy} onClick={() => void act(subscriptionService.activateDemo, "Capstone Demo Plus activated for 30 days. No payment was collected.")} className="mt-7 w-full rounded-xl border border-white/25 py-3 text-sm font-bold disabled:opacity-50">Activate Capstone Demo Plus</button>}
        {data?.plan === "PLUS" && <><button disabled={busy} onClick={() => void act(subscriptionService.cancel, "You are now on Free. Your financial records are unchanged.")} className="mt-7 w-full rounded-xl border border-white/25 py-3 text-sm font-bold disabled:opacity-50">{busy ? "Switching…" : "Switch to Free"}</button><p className="mt-3 text-[11px] leading-5 text-emerald-100/75">Returns to Free immediately and applies Free usage limits. {data.provider === "PAYMONGO" ? "Future PayMongo billing will stop." : "No real payment or refund is involved."}</p></>}
      </section>
    </div>
    <section className="mt-5 rounded-3xl border border-gray-200 bg-white p-6"><h2 className="text-lg font-bold">Always free</h2><p className="mt-2 text-sm leading-6 text-gray-600">Manual wallets, transactions, Safe-to-Spend, budgets, savings goals, debts and loans, search, CSV import, and spreadsheet/PDF reporting remain available on Free.</p></section>
    <section className="mt-5 rounded-3xl border border-gray-200 bg-white p-6"><h2 className="text-lg font-bold">Free and Plus compared</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-gray-200"><th scope="col" className="py-3 pr-4">Feature</th><th scope="col" className="px-3 py-3">Free</th><th scope="col" className="px-3 py-3">Plus</th></tr></thead><tbody>{FEATURES.map(([feature, free, plus]) => <tr key={feature} className="border-b border-gray-100 last:border-0"><th scope="row" className="py-3 pr-4 font-medium">{feature}</th><td className="px-3 py-3 text-gray-600">{free}</td><td className="px-3 py-3 text-emerald-800">{plus}</td></tr>)}</tbody></table></div><p className="mt-4 text-xs text-gray-500">Switching plans does not reset usage already recorded this month.</p></section>
  </main></div>;
}
