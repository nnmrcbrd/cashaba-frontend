"use client";

import type { ReactNode } from "react";
import { ArrowLeft, ShieldCheck, Sparkles, WalletCards } from "lucide-react";

interface OnboardingShellProps {
  step: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  asideTitle: string;
  asideDescription: string;
  children: ReactNode;
  onSkip?: () => void;
  onBack?: () => void;
}

export const onboardingInputClass =
  "h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100";

export const onboardingPrimaryButtonClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b6b4f] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#084f3b] focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50";

export default function OnboardingShell({
  step,
  title,
  description,
  asideTitle,
  asideDescription,
  children,
  onSkip,
  onBack,
}: OnboardingShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f9f8] text-slate-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_48%)]" />

      <header className="relative border-b border-slate-200/80 bg-white/95">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3 font-semibold tracking-tight text-[#0b5d43]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0b6b4f] text-lg font-bold text-white">₱</span>
            <span className="text-lg">Casha-Ba</span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
            <ShieldCheck size={14} />
            Secure financial setup
          </span>
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-6 flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#0b6b4f]">Step {step} of 4</span>
          <div className="flex flex-1 gap-1.5" aria-label={`Onboarding progress: step ${step} of 4`}>
            {[1, 2, 3, 4].map((item) => (
              <span
                key={item}
                className={`h-1.5 flex-1 rounded-full transition ${item <= step ? "bg-[#0b6b4f]" : "bg-slate-200"}`}
              />
            ))}
          </div>
        </div>

        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.10)] lg:grid lg:grid-cols-[0.78fr_1.22fr]">
          <aside className="relative overflow-hidden bg-[#073f30] p-7 text-white sm:p-9">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-300/10" />
            <div className="relative flex h-full min-h-60 flex-col">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-300">
                <WalletCards size={21} />
              </span>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Your financial baseline</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em]">{asideTitle}</h2>
              <p className="mt-4 text-sm leading-6 text-emerald-100/70">{asideDescription}</p>

              <div className="mt-auto pt-8">
                <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <Sparkles className="mt-0.5 shrink-0 text-emerald-300" size={17} />
                  <p className="text-xs leading-5 text-emerald-50/80">
                    You can review and update these values later from Casha-Ba settings.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <div className="p-6 sm:p-9 lg:p-11">
            {(onBack || onSkip) && (
              <div className="mb-6 flex min-h-10 items-center justify-between gap-4 border-b border-slate-100 pb-4">
                {onBack ? (
                  <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  >
                    <ArrowLeft size={16} aria-hidden="true" /> Back
                  </button>
                ) : <span />}
                {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  Skip for now
                </button>
                )}
              </div>
            )}
            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">{title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
            </div>
            {children}
          </div>
        </section>

        <p className="mt-5 text-center text-xs text-slate-500">
          Casha-Ba stores only the information you submit. It does not connect to or access a live financial account.
        </p>
      </div>
    </main>
  );
}
