import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Calculator,
  Check,
  FileSpreadsheet,
  Goal,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { ROUTES } from "@/constants";

const FEATURES = [
  {
    icon: ReceiptText,
    title: "Transactions that stay organized",
    description: "Record income and expenses manually, or review imported CSV and screenshot data before it affects your records.",
  },
  {
    icon: Goal,
    title: "Budgets, goals, and obligations",
    description: "Keep monthly limits, savings allocations, fixed expenses, and active debts visible in one system.",
  },
  {
    icon: BarChart3,
    title: "Analytics based on your records",
    description: "See actual category distribution, weekly spending, forecasts, and downloadable reports—not invented activity.",
  },
  {
    icon: Bot,
    title: "Gemini-supported assistance",
    description: "Ask for summaries and use supported financial commands while Casha-Ba validates required details.",
  },
];

const FAQS = [
  {
    question: "How is Safe-to-Spend calculated?",
    answer: "Casha-Ba starts with the income recorded for your current period, then subtracts unpaid obligations, planned savings, debt payments due, and expenses recorded during that period.",
  },
  {
    question: "Does Casha-Ba connect directly to my bank or e-wallet?",
    answer: "No. This capstone build uses the wallets, balances, transactions, and supporting files you enter or import. It does not access a live bank or e-wallet account.",
  },
  {
    question: "Can I sign in with Google?",
    answer: "Yes. When Google OAuth is configured by the app administrator, you can create or access your Casha-Ba account using a verified Google email address.",
  },
  {
    question: "Does the AI Assistant change my financial records automatically?",
    answer: "No. Commands that would change your records show a preview and require your confirmation before Casha-Ba saves them.",
  },
  {
    question: "Can I export or delete my information?",
    answer: "Yes. The Security section in Settings lets you download your account data or permanently delete your account through a protected confirmation step.",
  },
  {
    question: "Is Casha-Ba a financial adviser?",
    answer: "No. Casha-Ba is a personal-finance capstone tool for organizing user-provided records. Its summaries and AI responses are informational and do not replace professional financial advice.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f7f9f8] text-slate-950">
      <header className="themed-sticky-header sticky top-0 z-40 border-b border-slate-200/80 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight text-[#0b5d43]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0b6b4f] text-lg font-bold text-white">₱</span>
            <span className="text-lg">Casha-Ba</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-[#0b6b4f]">Features</a>
            <a href="#how-it-works" className="hover:text-[#0b6b4f]">How it works</a>
            <a href="#scope" className="hover:text-[#0b6b4f]">Current scope</a>
            <a href="#faq" className="hover:text-[#0b6b4f]">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href={ROUTES.LOGIN} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:px-4">Sign in</Link>
            <Link href={ROUTES.SIGNUP} className="rounded-xl bg-[#0b6b4f] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#084f3b] sm:px-4">Create account</Link>
          </div>
        </div>
      </header>

      <section className="overflow-hidden border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
              <ShieldCheck size={14} />
              Personal finance capstone system
            </span>
            <h1 className="mt-7 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              Know what you can safely spend—before you spend it.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Casha-Ba turns the financial information you enter into one understandable view of income, obligations, savings, expenses, and remaining Safe-to-Spend.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={ROUTES.SIGNUP} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0b6b4f] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#084f3b]">
                Create a test account <ArrowRight size={17} />
              </Link>
              <a href="#how-it-works" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                See how it works
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-2"><Check className="text-emerald-700" size={15} /> Peso-based records</span>
              <span className="flex items-center gap-2"><Check className="text-emerald-700" size={15} /> Gemini-supported</span>
              <span className="flex items-center gap-2"><Check className="text-emerald-700" size={15} /> No paid plan</span>
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-[#f4f7f5] p-4 shadow-[0_28px_80px_rgba(15,23,42,0.12)] sm:p-6">
            <div className="rounded-[24px] border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Safe-to-Spend</p>
                  <p className="mt-2 text-4xl font-semibold tracking-tight text-[#086b4f]">₱9,500</p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800">Example only</span>
              </div>
              <div className="my-6 h-px bg-slate-200" />
              <div className="space-y-4 text-sm">
                {[
                  ["Monthly income", "₱25,000", "text-emerald-700"],
                  ["Fixed obligations", "− ₱8,000", "text-slate-700"],
                  ["Savings allocations", "− ₱3,000", "text-slate-700"],
                  ["Expenses this period", "− ₱4,500", "text-rose-600"],
                ].map(([label, value, color]) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">{label}</span>
                    <span className={`font-semibold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-[#073f30] p-4 text-xs leading-5 text-emerald-50">
                The displayed amount is calculated from the records stored in your own account.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-18 sm:px-8 sm:py-22">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0b6b4f]">Core features</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">One system for the records that affect your money.</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">Every feature below exists in the current build and uses account-specific data.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.04)]">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-[#0b6b4f]"><feature.icon size={21} /></span>
              <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-[#073f30] text-white">
        <div className="mx-auto max-w-7xl px-5 py-18 sm:px-8 sm:py-22">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">How it works</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">A financial workflow you can explain during your defense.</h2>
              <p className="mt-4 text-sm leading-6 text-emerald-100/70">The calculation is transparent and the AI is not the source of truth for your balances.</p>
            </div>
            <div className="grid gap-4">
              {[
                [WalletCards, "1", "Set your baseline", "Enter your income period, fixed expenses, budget, and savings allocations."],
                [FileSpreadsheet, "2", "Record financial activity", "Add transactions directly or review supported imports before saving them."],
                [Calculator, "3", "Review the result", "Casha-Ba recalculates Safe-to-Spend and updates dashboards, alerts, and analytics."],
              ].map(([Icon, number, title, description]) => {
                const StepIcon = Icon as typeof WalletCards;
                return (
                  <div key={String(number)} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300"><StepIcon size={20} /></span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300">Step {String(number)}</p>
                      <h3 className="mt-1 font-semibold">{String(title)}</h3>
                      <p className="mt-1 text-sm leading-6 text-emerald-100/65">{String(description)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="scope" className="mx-auto max-w-7xl px-5 py-18 sm:px-8 sm:py-22">
        <div className="grid gap-8 rounded-[30px] border border-slate-200 bg-white p-7 sm:p-10 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <div className="flex items-center gap-3 text-[#0b6b4f]"><LockKeyhole size={22} /><span className="text-xs font-bold uppercase tracking-[0.18em]">Current scope</span></div>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em]">Transparent about what this build does—and does not do.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
              Casha-Ba is a capstone development system. It does not connect directly to live bank accounts, offer paid plans, or replace professional financial advice.
            </p>
          </div>
          <ul className="space-y-3 rounded-2xl bg-slate-50 p-5 text-sm text-slate-700">
            <li className="flex gap-2"><Check className="mt-0.5 shrink-0 text-emerald-700" size={16} /> Use test or demonstration financial records.</li>
            <li className="flex gap-2"><Check className="mt-0.5 shrink-0 text-emerald-700" size={16} /> Review AI-extracted details before relying on them.</li>
            <li className="flex gap-2"><Check className="mt-0.5 shrink-0 text-emerald-700" size={16} /> Keep your Gemini key and credentials private.</li>
          </ul>
        </div>
      </section>

      <section id="faq" className="border-t border-slate-200 bg-white scroll-mt-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0b6b4f]">Frequently asked questions</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Clear answers before you begin.</h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-600">
              Learn what Casha-Ba calculates, what information it uses, and how your account is protected.
            </p>
          </div>

          <div className="divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200 bg-[#f7f9f8]">
            {FAQS.map((faq, index) => (
              <details key={faq.question} className="group bg-white px-5 py-1 sm:px-6" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-sm font-semibold text-slate-900 marker:content-none">
                  {faq.question}
                  <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-lg leading-none text-emerald-700 transition group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-2xl pb-5 pr-10 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Ready to evaluate the current build?</h2>
            <p className="mt-2 text-sm text-slate-500">Create a test account, complete onboarding, and verify each calculation.</p>
          </div>
          <Link href={ROUTES.SIGNUP} className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#0b6b4f] px-6 text-sm font-semibold text-white hover:bg-[#084f3b]">
            Create test account <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-[#f7f9f8]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 Casha-Ba. Capstone development build.</p>
          <p>No live bank connection • No paid subscription • Test data recommended</p>
        </div>
      </footer>
    </main>
  );
}
