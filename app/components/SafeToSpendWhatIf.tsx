"use client";

import { useMemo, useState } from "react";
import { Calculator, TrendingDown, TrendingUp, X } from "lucide-react";
import {
  calculateSafeToSpendScenario,
  safeToSpendScenarioOptions,
  type SafeToSpendScenarioKind,
} from "@/lib/safeToSpendScenario";

interface SafeToSpendWhatIfProps {
  currentSafeToSpend: number;
  rawSafeToSpend: number;
  periodLabel: string;
  onClose: () => void;
}

function peso(amount: number) {
  return `₱${Math.abs(amount).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SafeToSpendWhatIf({ currentSafeToSpend, rawSafeToSpend, periodLabel, onClose }: SafeToSpendWhatIfProps) {
  const [kind, setKind] = useState<SafeToSpendScenarioKind>("expense");
  const [amount, setAmount] = useState("");
  const numericAmount = Number(amount);
  const selectedOption = safeToSpendScenarioOptions.find((option) => option.value === kind) || safeToSpendScenarioOptions[0];
  const result = useMemo(
    () => calculateSafeToSpendScenario(rawSafeToSpend, kind, numericAmount),
    [rawSafeToSpend, kind, numericAmount],
  );
  const toneClasses = {
    positive: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    critical: "border-red-200 bg-red-50 text-red-800",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="what-if-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">Safe-to-Spend What-If Calculator</p>
              <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-bold text-blue-700">Preview only</span>
            </div>
            <h2 id="what-if-title" className="mt-1 text-2xl font-extrabold text-slate-950">What would happen to your Safe-to-Spend?</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Test one possible change for this {periodLabel}. Nothing here is saved or added to your records.</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Close What-If Calculator"><X size={18} /></button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="scenario-kind" className="field-label">Possible event</label>
            <select id="scenario-kind" value={kind} onChange={(event) => setKind(event.target.value as SafeToSpendScenarioKind)} className="field-input">
              {safeToSpendScenarioOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <p className="mt-1.5 text-[11px] leading-4 text-slate-500">{selectedOption.description}</p>
          </div>
          <div>
            <label htmlFor="scenario-amount" className="field-label">Amount</label>
            <input id="scenario-amount" type="number" min="0" step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className="field-input" placeholder="0.00" />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ResultCard label="Current Safe-to-Spend" value={peso(currentSafeToSpend)} detail="Based on your saved records" />
          <ResultCard label="Scenario change" value={`${result.impact >= 0 ? "+" : "−"} ${peso(result.impact)}`} detail={selectedOption.label} tone={result.impact > 0 ? "positive" : result.impact < 0 ? "negative" : "neutral"} />
          <ResultCard label="Projected Safe-to-Spend" value={peso(result.projectedSafeToSpend)} detail="Preview after this one change" featured />
          <ResultCard label="Difference" value={`${result.difference > 0 ? "+" : result.difference < 0 ? "−" : ""}${peso(result.difference)}`} detail="Compared with your current amount" tone={result.difference > 0 ? "positive" : result.difference < 0 ? "negative" : "neutral"} />
        </div>

        <div className={`mt-4 rounded-2xl border px-4 py-3 text-xs leading-5 ${toneClasses[result.tone]}`}>{result.message}</div>

        <div className="mt-5 rounded-2xl bg-slate-900 p-4 text-white">
          <div className="flex items-center gap-2 text-xs font-bold"><Calculator className="h-4 w-4 text-emerald-300" aria-hidden="true" />Calculation preview</div>
          <p className="mt-2 text-xs text-slate-300">Current raw Safe-to-Spend {result.impact >= 0 ? "+" : "−"} scenario amount = projected amount after all existing obligations, savings, loan payments, and expenses.</p>
          {result.shortfall > 0 && <p className="mt-2 flex items-center gap-2 text-xs font-bold text-red-300"><TrendingDown className="h-4 w-4" aria-hidden="true" />Remaining shortfall: {peso(result.shortfall)}</p>}
          {result.difference > 0 && <p className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-300"><TrendingUp className="h-4 w-4" aria-hidden="true" />Available amount increases by {peso(result.difference)}</p>}
        </div>

        <div className="mt-6 flex justify-end"><button type="button" onClick={onClose} className="rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800">Done</button></div>
      </section>
    </div>
  );
}

function ResultCard({ label, value, detail, tone = "neutral", featured = false }: { label: string; value: string; detail: string; tone?: "positive" | "negative" | "neutral"; featured?: boolean }) {
  const valueColor = tone === "positive" ? "text-emerald-700" : tone === "negative" ? "text-red-600" : featured ? "text-emerald-300" : "text-slate-900";
  return <article className={`rounded-2xl border p-4 ${featured ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white"}`}><p className={`text-[10px] font-bold uppercase tracking-[0.1em] ${featured ? "text-slate-300" : "text-slate-500"}`}>{label}</p><p className={`mt-2 text-xl font-extrabold ${valueColor}`}>{value}</p><p className={`mt-1 text-[10px] ${featured ? "text-slate-400" : "text-slate-500"}`}>{detail}</p></article>;
}
