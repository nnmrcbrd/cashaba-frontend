import Link from "next/link";
import { ArrowLeft, BadgeCheck, Calculator, ShieldCheck } from "lucide-react";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main className="min-h-dvh bg-[#f3f6f4] text-slate-900">
      <div className="mx-auto flex min-h-dvh max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-1">
          <Link href="/" className="inline-flex items-center gap-3 font-semibold tracking-tight text-[#0b5d43]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0b6b4f] text-lg font-bold text-white shadow-sm">₱</span>
            <span className="text-lg">Casha-Ba</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#0b6b4f]">
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-8 py-4 lg:grid-cols-[1.02fr_0.98fr] lg:py-6">
          <section className="hidden overflow-hidden rounded-[32px] bg-[#073f30] p-8 text-white shadow-[0_30px_80px_rgba(7,63,48,0.18)] lg:block">
            <div className="max-w-lg">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                <BadgeCheck size={14} />
                Capstone development build
              </span>
              <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.03em]">
                Your financial records should add up—and stay understandable.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-emerald-100/75">
                Casha-Ba combines the income, obligations, savings allocations, and expenses you enter into one clear Safe-to-Spend figure.
              </p>

              <div className="mt-7 rounded-3xl border border-white/10 bg-white/[0.07] p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300"><Calculator size={20} /></span>
                  <div>
                    <p className="text-xs font-medium text-emerald-100/60">Safe-to-Spend formula</p>
                    <p className="mt-1 text-sm font-semibold">Income − obligations − savings − expenses</p>
                  </div>
                </div>
                <div className="my-5 h-px bg-white/10" />
                <div className="flex items-start gap-3 text-xs leading-5 text-emerald-100/70">
                  <ShieldCheck className="mt-0.5 shrink-0 text-emerald-300" size={17} />
                  Use test financial information while evaluating this development build.
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[520px]">
            <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_22px_60px_rgba(15,23,42,0.08)] sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0b6b4f]">{eyebrow}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.025em] text-slate-950">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
              <div className="mt-5">{children}</div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
