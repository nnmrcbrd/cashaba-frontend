"use client";

import Link from "next/link";
import { ArrowRight, LogOut, ShieldX } from "lucide-react";
import { ROUTES } from "@/constants";

interface AccessDeniedProps {
  isAdmin: boolean;
  onLogout: () => Promise<void>;
}

export default function AccessDenied({ isAdmin, onLogout }: AccessDeniedProps) {
  const destination = isAdmin ? ROUTES.ADMIN_MANAGE_USERS : ROUTES.DASHBOARD;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f4f8f6] px-5 py-10 dark:bg-slate-950">
      <div className="pointer-events-none absolute -left-24 top-[-7rem] h-80 w-80 rounded-full bg-emerald-200/35 blur-3xl dark:bg-emerald-800/15" />
      <div className="pointer-events-none absolute -bottom-32 right-[-5rem] h-96 w-96 rounded-full bg-teal-200/30 blur-3xl dark:bg-teal-800/10" />

      <section className="relative w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-7 text-center shadow-[0_24px_80px_rgba(15,23,42,0.10)] dark:border-slate-700 dark:bg-slate-900 sm:p-10">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300">
          <ShieldX className="h-8 w-8" aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-red-600 dark:text-red-300">
          Access denied
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
          You cannot open this page
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
          This area belongs to a different account role. Your account and data remain secure.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={destination}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#126b4d] px-5 text-sm font-bold text-white transition hover:bg-[#0d573e] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Go to my dashboard
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => void onLogout()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </section>
    </main>
  );
}
