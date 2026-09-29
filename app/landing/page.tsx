import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import {
  ArrowRight,
  Banknote,
  Bot,
  Check,
  FileCheck2,
  Landmark,
  LockKeyhole,
  MessageSquareText,
  PhilippinePeso,
  PiggyBank,
  ReceiptText,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react";
import { ROUTES } from "@/constants";
import LandingExperience from "./LandingExperience";
import ThemeToggle from "./ThemeToggle";

const FAQS = [
  {
    question: "How does Casha-Ba calculate Safe-to-Spend?",
    answer: "It starts with income for your current period, then subtracts unpaid obligations, active savings allocations, and expenses recorded in that period. The displayed result never drops below zero.",
  },
  {
    question: "Does Casha-Ba connect to banks or e-wallets?",
    answer: "No. You manually create accounts and record or import activity. Casha-Ba does not retrieve live balances, authenticate with financial institutions, or move real money.",
  },
  {
    question: "Can the AI change my records by itself?",
    answer: "No. The assistant can interpret supported commands, but any action that changes financial records requires your confirmation and still passes backend validation.",
  },
  {
    question: "What can I track?",
    answer: "You can track income, expenses, manual accounts, transfers, budgets, savings goals, recurring obligations, borrowed money, and money you have lent.",
  },
  {
    question: "Can I export or delete my information?",
    answer: "Yes. Account settings include protected options for downloading your information and permanently deleting your account.",
  },
];

const AI_FLOW = [
  {
    icon: MessageSquareText,
    title: "Say what happened",
    description: "Write a natural command such as, “Spent ₱150 on groceries.” The assistant identifies the action and the details it needs.",
  },
  {
    icon: FileCheck2,
    title: "Review before anything changes",
    description: "Casha-Ba shows what it understood. Missing or unclear details trigger a question, not an invented answer.",
  },
  {
    icon: PhilippinePeso,
    title: "See the financial impact",
    description: "After confirmation, the backend validates the request, updates the record, and recalculates Safe-to-Spend.",
  },
];

function BrandMark() {
  return (
    <span className="flex items-center gap-3 font-semibold tracking-[-0.02em] text-[#123e30] dark:text-[#ecf5f0]">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#17694d] text-base font-bold text-white">₱</span>
      <span className="text-lg">Casha-Ba</span>
    </span>
  );
}

export default function LandingPage() {
  return (
    <main className={GeistSans.className + " w-full max-w-full overflow-x-clip bg-[#f5f7f2] text-[#10231d] dark:bg-[#0d1713] dark:text-[#edf4ef]"}>
      <header className="sticky top-0 z-50 border-b border-[#173d31]/10 bg-[#f5f7f2]/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1713]/90">
          <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
            <Link href="/" aria-label="Casha-Ba home"><BrandMark /></Link>
            <nav aria-label="Landing page navigation" className="hidden items-center gap-7 text-sm font-medium text-[#52665e] dark:text-[#b4c1ba] lg:flex">
              <a href="#features" className="transition hover:text-[#17694d] dark:hover:text-[#8dd2b2]">Features</a>
              <a href="#pricing" className="transition hover:text-[#17694d] dark:hover:text-[#8dd2b2]">Pricing</a>
              <a href="#how-it-works" className="transition hover:text-[#17694d] dark:hover:text-[#8dd2b2]">How it works</a>
              <a href="#security" className="transition hover:text-[#17694d] dark:hover:text-[#8dd2b2]">Security</a>
              <a href="#questions" className="transition hover:text-[#17694d] dark:hover:text-[#8dd2b2]">Questions</a>
            </nav>
            <div className="flex items-center gap-1 sm:gap-3">
              <ThemeToggle />
              <Link href={ROUTES.LOGIN} className="rounded-full px-3 py-2 text-sm font-semibold text-[#20382f] transition hover:bg-[#e5ebe5] active:scale-[0.98] dark:text-[#dce8e1] dark:hover:bg-white/10 sm:px-4">Sign in</Link>
              <Link href={ROUTES.SIGNUP} className="whitespace-nowrap rounded-full bg-[#17694d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#10583f] active:scale-[0.98] sm:px-5">Create account</Link>
            </div>
          </div>
      </header>

      <LandingExperience>

        <section className="relative flex min-h-[calc(100dvh-72px)] items-center overflow-hidden border-b border-[#173d31]/10 px-5 py-16 dark:border-white/10 sm:px-8 lg:py-20">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,rgba(23,105,77,0.13),transparent_38%)] dark:bg-[radial-gradient(circle_at_82%_20%,rgba(77,160,119,0.12),transparent_40%)]" />
          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
            <div>
              <h1 data-hero-reveal className="max-w-4xl text-[clamp(3.4rem,5.8vw,6.2rem)] font-semibold leading-[0.9] tracking-[-0.065em] text-[#10231d] dark:text-[#f1f6f2]">
                Know what’s safe to spend.
              </h1>
              <p data-hero-reveal className="mt-7 max-w-xl text-lg leading-8 text-[#52665e] dark:text-[#b7c5bd]">
                Casha-Ba turns income, bills, savings, and everyday expenses into one clear number before your next decision.
              </p>
              <div data-hero-reveal className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href={ROUTES.SIGNUP} className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#17694d] px-6 text-sm font-semibold text-white transition hover:bg-[#10583f] active:scale-[0.98]">
                  Create account <ArrowRight size={17} strokeWidth={1.75} aria-hidden="true" />
                </Link>
                <a href="#how-it-works" className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-full border border-[#173d31]/20 bg-transparent px-6 text-sm font-semibold text-[#173d31] transition hover:border-[#17694d] hover:text-[#17694d] active:scale-[0.98] dark:border-white/20 dark:text-[#ecf4ef] dark:hover:border-[#8dd2b2] dark:hover:text-[#8dd2b2]">
                  See how it works
                </a>
              </div>
            </div>

            <div data-hero-reveal className="relative lg:pl-6">
              <div className="rounded-[1.75rem] border border-[#173d31]/12 bg-[#102f25] p-5 text-white shadow-[0_28px_80px_rgba(16,47,37,0.16)] sm:p-7">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-sm text-[#a9c4b6]">Safe-to-Spend</p>
                    <p className="mt-8 max-w-md text-5xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-6xl">What remains after real life.</p>
                  </div>
                  <ShieldCheck size={28} strokeWidth={1.5} className="text-[#8dd2b2]" aria-hidden="true" />
                </div>
                <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 text-sm">
                  {["Income", "Obligations", "Savings", "Spending"].map((label) => <span key={label} className="bg-[#153b2e] px-4 py-5 text-[#b9cec3]">{label}</span>)}
                </div>
              </div>
              <div className="absolute -bottom-6 -left-2 hidden max-w-52 rounded-2xl border border-[#173d31]/10 bg-[#fbfcf9] p-4 shadow-[0_16px_40px_rgba(16,47,37,0.12)] dark:border-white/10 dark:bg-[#17251f] lg:block">
                <p className="text-xs leading-5 text-[#52665e] dark:text-[#b7c5bd]">The number updates when your financial records change.</p>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Product principles" className="border-b border-[#173d31]/10 bg-[#edf1eb] px-5 dark:border-white/10 dark:bg-[#111e18] sm:px-8">
          <div className="mx-auto grid max-w-7xl divide-y divide-[#173d31]/10 dark:divide-white/10 md:grid-cols-[1.2fr_0.8fr_1fr] md:divide-x md:divide-y-0">
            <p className="py-7 text-sm font-medium md:pr-8">Built around Philippine peso records</p>
            <p className="py-7 text-sm text-[#52665e] dark:text-[#b7c5bd] md:px-8">Free core tracking · optional Casha-Ba Plus</p>
            <p className="py-7 text-sm text-[#52665e] dark:text-[#b7c5bd] md:pl-8">You confirm record-changing AI actions</p>
          </div>
        </section>

        <section id="features" className="px-5 py-28 sm:px-8 md:py-40">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <h2 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl lg:text-6xl">Your whole money picture, held together.</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#52665e] dark:text-[#b7c5bd]">Track what came in, what must go out, and what remains available across the accounts you manage.</p>
            </div>

            <div className="mt-16 grid grid-flow-dense gap-4 lg:grid-cols-6 lg:auto-rows-[14rem]">
              <article data-feature-card data-formula-reveal className="flex min-h-[30rem] flex-col rounded-[1.75rem] bg-[#102f25] p-7 text-white lg:col-span-4 lg:row-span-2 sm:p-9">
                <div className="flex items-center justify-between"><PhilippinePeso size={28} strokeWidth={1.6} className="text-[#8dd2b2]" aria-hidden="true" /><span className="text-sm text-[#a9c4b6]">Safe-to-Spend</span></div>
                <div className="my-auto max-w-3xl py-12 text-4xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-5xl">
                  <span data-formula-word>Income </span><span data-formula-word className="text-[#8dd2b2]">minus obligations, </span><span data-formula-word>planned savings, </span><span data-formula-word>and current-period expenses.</span>
                </div>
                <p className="max-w-xl text-sm leading-6 text-[#b9cec3]">A transparent calculation that updates after financial activity and stops at ₱0.00 when commitments exceed income.</p>
              </article>

              <article data-feature-card className="group flex min-h-64 flex-col overflow-hidden rounded-[1.75rem] border border-[#173d31]/10 bg-[#cde7d8] p-7 text-[#123e30] transition-transform duration-500 hover:-translate-y-1 dark:border-white/10 dark:bg-[#1d4938] dark:text-[#edf5f0] lg:col-span-2 lg:row-span-2">
                <WalletCards size={28} strokeWidth={1.6} aria-hidden="true" />
                <div className="mt-auto pt-16">
                  <h3 className="text-2xl font-semibold tracking-[-0.035em]">Every account, manually under your control.</h3>
                  <p className="mt-4 text-sm leading-6 text-[#345b4c] dark:text-[#bcd3c8]">Track cash, bank, e-wallet, credit, investment, and other accounts without connecting to a financial institution.</p>
                </div>
              </article>

              <article data-feature-card className="group flex min-h-64 flex-col rounded-[1.75rem] border border-[#173d31]/10 bg-[#fbfcf9] p-7 transition-transform duration-500 hover:-translate-y-1 dark:border-white/10 dark:bg-[#17251f] lg:col-span-2 lg:row-span-2">
                <ReceiptText size={28} strokeWidth={1.6} className="text-[#17694d] dark:text-[#8dd2b2]" aria-hidden="true" />
                <div className="mt-auto pt-16">
                  <h3 className="text-2xl font-semibold tracking-[-0.035em]">Transactions with context.</h3>
                  <p className="mt-4 text-sm leading-6 text-[#52665e] dark:text-[#b7c5bd]">Record activity directly, import a CSV, or review screenshot extraction before it becomes part of your history.</p>
                </div>
              </article>

              <article data-feature-card className="relative flex min-h-64 flex-col overflow-hidden rounded-[1.75rem] border border-[#173d31]/10 bg-[#dce3d9] p-7 transition-transform duration-500 hover:-translate-y-1 dark:border-white/10 dark:bg-[#20312a] lg:col-span-4 lg:row-span-2 sm:p-9">
                <div aria-hidden="true" className="absolute right-8 top-8 flex gap-3 text-[#789486] dark:text-[#799789]"><PiggyBank size={46} strokeWidth={1.25} /><Landmark size={46} strokeWidth={1.25} /><Banknote size={46} strokeWidth={1.25} /></div>
                <div className="mt-auto max-w-xl pt-24">
                  <h3 className="text-3xl font-semibold tracking-[-0.04em]">Plans that stay connected to real activity.</h3>
                  <p className="mt-4 text-sm leading-6 text-[#52665e] dark:text-[#b7c5bd]">Set budgets, fund savings goals, manage recurring obligations, and follow borrowed or lent money from one system.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="how-it-works" data-story-section className="bg-[#101b16] px-5 py-28 text-[#eff5f1] sm:px-8 md:py-40">
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.82fr_1.18fr] lg:gap-24">
            <div data-story-copy className="self-start lg:py-20">
              <Bot size={30} strokeWidth={1.5} className="text-[#8dd2b2]" aria-hidden="true" />
              <h2 className="mt-7 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl lg:text-6xl">AI helps with the work. You stay in control.</h2>
              <p className="mt-6 max-w-lg text-base leading-7 text-[#aebdb5]">Gemini can interpret supported financial commands. The backend remains the source of truth for every saved change.</p>
            </div>
            <div className="lg:py-20">
              {AI_FLOW.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="min-h-[19rem] border-b border-white/12 py-16 first:pt-0 last:border-b-0 lg:min-h-[24rem]">
                    <Icon size={32} strokeWidth={1.5} className="text-[#8dd2b2]" aria-hidden="true" />
                    <h3 className="mt-8 max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{item.title}</h3>
                    <p className="mt-5 max-w-xl text-base leading-7 text-[#aebdb5]">{item.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="security" className="px-5 py-28 sm:px-8 md:py-40">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <LockKeyhole size={29} strokeWidth={1.6} className="text-[#17694d] dark:text-[#8dd2b2]" aria-hidden="true" />
              <h2 className="mt-7 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl lg:text-6xl">Clear about what the system does.</h2>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#52665e] dark:text-[#b7c5bd]">Casha-Ba organizes the financial information you provide. It is not a bank, payment service, or substitute for professional financial advice.</p>
            </div>

            <div className="mt-16 grid overflow-hidden rounded-[1.75rem] border border-[#173d31]/10 bg-[#fbfcf9] dark:border-white/10 dark:bg-[#17251f] md:grid-cols-2">
              <div className="p-7 sm:p-10">
                <h3 className="text-2xl font-semibold tracking-[-0.035em]">What it does</h3>
                <div className="mt-8 space-y-6">
                  {["Protects financial routes with authenticated sessions", "Keeps administrator access separate from personal records", "Lets you export information or delete your account", "Uses the records in your account for calculations"].map((item) => <p key={item} className="flex gap-3 text-sm leading-6 text-[#425a50] dark:text-[#c0cec7]"><Check className="mt-0.5 shrink-0 text-[#17694d] dark:text-[#8dd2b2]" size={18} strokeWidth={1.8} aria-hidden="true" />{item}</p>)}
                </div>
              </div>
              <div className="border-t border-[#173d31]/10 bg-[#edf1eb] p-7 dark:border-white/10 dark:bg-[#111e18] sm:p-10 md:border-l md:border-t-0">
                <h3 className="text-2xl font-semibold tracking-[-0.035em]">What it does not do</h3>
                <div className="mt-8 space-y-6">
                  {["Connect to a live bank or e-wallet", "Move money or process a payment", "Guarantee an AI extraction is correct", "Treat AI output as financial advice"].map((item) => <p key={item} className="flex gap-3 text-sm leading-6 text-[#52665e] dark:text-[#b7c5bd]"><X className="mt-0.5 shrink-0 text-[#6d8077]" size={18} strokeWidth={1.8} aria-hidden="true" />{item}</p>)}
                </div>
              </div>
            </div>
          </div>
        </section>
      </LandingExperience>

      <section id="questions" className="border-b border-[#173d31]/10 px-5 py-28 dark:border-white/10 sm:px-8 md:py-40">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
          <div>
            <h2 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Questions, answered plainly.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[#52665e] dark:text-[#b7c5bd]">The important details about calculations, connectivity, AI, and your information.</p>
          </div>
          <div>
            {FAQS.map((faq, index) => (
              <details key={faq.question} className="group border-b border-[#173d31]/12 py-2 dark:border-white/12" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-base font-semibold marker:content-none sm:text-lg">
                  {faq.question}
                  <span aria-hidden="true" className="text-2xl font-light text-[#17694d] transition-transform group-open:rotate-45 dark:text-[#8dd2b2]">+</span>
                </summary>
                <p className="max-w-2xl pb-6 pr-10 text-sm leading-6 text-[#52665e] dark:text-[#b7c5bd]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-b border-[#173d31]/10 bg-[#edf1eb] px-5 py-28 dark:border-white/10 dark:bg-[#111e18] sm:px-8 md:py-40">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#17694d] dark:text-[#8dd2b2]">Simple pricing</p>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl lg:text-6xl">Start free. Upgrade when AI saves you time.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#52665e] dark:text-[#b7c5bd]">Every essential money-management feature remains available on Free. Plus expands the features that use ongoing AI and image-processing services.</p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            <article className="flex flex-col rounded-[1.75rem] border border-[#173d31]/12 bg-[#fbfcf9] p-7 dark:border-white/10 dark:bg-[#17251f] sm:p-9">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#52665e] dark:text-[#b7c5bd]">Casha-Ba Free</p>
              <div className="mt-4 flex items-end gap-2"><strong className="text-5xl font-semibold tracking-[-0.05em]">₱0</strong><span className="pb-1 text-sm text-[#52665e] dark:text-[#b7c5bd]">forever</span></div>
              <div className="mt-8 space-y-4 text-sm leading-6 text-[#425a50] dark:text-[#c0cec7]">
                {["Wallets, transactions, transfers, and search", "Safe-to-Spend, budgets, goals, and debts", "CSV import and financial reports", "10 AI coach requests each month", "5 receipt or GCash scans each month"].map((item) => <p key={item} className="flex gap-3"><Check className="mt-1 shrink-0 text-[#17694d] dark:text-[#8dd2b2]" size={17} aria-hidden="true" />{item}</p>)}
              </div>
              <Link href={ROUTES.SIGNUP} className="mt-10 inline-flex h-12 items-center justify-center rounded-full border border-[#17694d] px-6 text-sm font-semibold text-[#17694d] transition hover:bg-[#17694d] hover:text-white dark:border-[#8dd2b2] dark:text-[#8dd2b2]">Create free account</Link>
            </article>

            <article className="relative flex flex-col overflow-hidden rounded-[1.75rem] bg-[#073f30] p-7 text-white shadow-[0_28px_70px_rgba(7,63,48,0.18)] sm:p-9">
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-300/10" />
              <div className="relative">
                <span className="rounded-full bg-emerald-300 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#073f30]">More AI capacity</span>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Casha-Ba Plus</p>
                <div className="mt-4 flex items-end gap-2"><strong className="text-5xl font-semibold tracking-[-0.05em]">₱99</strong><span className="pb-1 text-sm text-emerald-100/70">per month</span></div>
                <div className="mt-8 space-y-4 text-sm leading-6 text-emerald-50">
                  {["Everything included in Free", "200 AI coach requests each month", "100 receipt or GCash scans each month", "Personalized AI financial insight cards", "Usage dashboard and period tracking"].map((item) => <p key={item} className="flex gap-3"><Check className="mt-1 shrink-0 text-emerald-300" size={17} aria-hidden="true" />{item}</p>)}
                </div>
                <Link href={ROUTES.SIGNUP} className="mt-10 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-300 px-6 text-sm font-extrabold text-[#073f30] transition hover:bg-emerald-200">Create account to try Plus <ArrowRight size={17} aria-hidden="true" /></Link>
                <p className="mt-4 text-xs leading-5 text-emerald-100/60">Plus activation currently uses the capstone test flow. Live payment collection requires production PayMongo activation.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-[#17694d] px-5 py-28 text-white sm:px-8 md:py-40">
        <div className="mx-auto max-w-7xl">
          <h2 className="max-w-5xl text-5xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-8xl">Make the next money decision with context.</h2>
          <div className="mt-10 flex flex-col items-start justify-between gap-7 border-t border-white/20 pt-7 sm:flex-row sm:items-center">
            <p className="max-w-xl text-base leading-7 text-[#d8ebe1]">Create an account, complete the guided setup, and let your own records build the picture.</p>
            <Link href={ROUTES.SIGNUP} className="inline-flex h-12 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-[#f5f7f2] px-6 text-sm font-semibold text-[#123e30] transition hover:bg-white active:scale-[0.98]">Create account <ArrowRight size={17} strokeWidth={1.75} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#0d1713] px-5 py-12 text-[#c1cec7] sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <div><BrandMark /><p className="mt-5 max-w-md text-sm leading-6 text-[#879a90]">A personal-finance capstone system for clearer spending, saving, and planning decisions.</p></div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm"><Link href={ROUTES.LOGIN} className="hover:text-white">Sign in</Link><Link href={ROUTES.SIGNUP} className="hover:text-white">Create account</Link><a href="#features" className="hover:text-white">Features</a><a href="#questions" className="hover:text-white">Questions</a></div>
        </div>
        <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-2 border-t border-white/10 pt-6 text-xs text-[#71847a] sm:flex-row sm:items-center sm:justify-between"><p>© 2026 Casha-Ba</p><p>Capstone development build. Demo data recommended.</p></div>
      </footer>
    </main>
  );
}
