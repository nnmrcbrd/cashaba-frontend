"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/ui/sidebar";
import IncomeExpenseChart from "../components/IncomeExpenseChart";
import apiClient from "@/lib/apiClient";
import { useAuth } from "@/context/Authcontext";
import { exportFinancialReport } from "@/lib/pdfExport";
import { exportTransactionsCSV } from "@/lib/csvExport";
import type { Transaction, TransactionType } from "../types";

type Period = "week" | "month" | "last-month" | "custom";
interface AnalyticsResponse {
  period: { key: Period; start: string; end: string };
  summary: { totalIncome: number; loanCollections: number; configuredIncome: number; totalExpenses: number; netCashFlow: number; transactionCount: number; expenseCount: number };
  categories: Array<{ name: string; amount: number; percentage: number }>;
  topCategory: { name: string; amount: number; percentage: number } | null;
  trend: Array<{ date: string; income: number; expense: number }>;
  budget: { configured: boolean; target: number; spent: number; remaining: number; percentage: number };
  savings: { saved: number; target: number; percentage: number; goals: number };
  comparison: { previousExpenses: number; expenseChangePct: number | null };
  forecast: { projectedExpenses: number; projectedBalance: number; plannedProjectedBalance?: number; method?: string; incomeBasis?: string; sparseData?: boolean };
  review: {
    status: { label: string; detail: string; tone: "positive" | "warning" | "critical" | "neutral" };
    strongestArea: string;
    mainConcern: string;
    recommendedAction: string;
  };
  transactions: Transaction[];
}

const palette = ["#047857", "#0284c7", "#f59e0b", "#dc2626", "#7c3aed", "#db2777", "#64748b"];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportNotice, setExportNotice] = useState("");

  useEffect(() => {
    if (period === "custom" && (!startDate || !endDate)) return;
    const timer = window.setTimeout(() => {
      setLoading(true); setError("");
      const query = new URLSearchParams({ period });
      if (period === "custom") { query.set("startDate", startDate); query.set("endDate", endDate); }
      apiClient.get(`/analytics?${query}`).then((response) => setData(response.data)).catch(() => setError("Unable to generate analytics for this period.")).finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [period, startDate, endDate]);

  const donut = useMemo(() => {
    const categories = data?.categories || [];
    return categories.map((category, index) => ({ ...category, color: palette[index % palette.length], offset: -categories.slice(0, index).reduce((sum, item) => sum + item.percentage, 0) }));
  }, [data]);

  function mappedTransactions() {
    return (data?.transactions || []).map((item) => ({ ...item, type: item.type.toLowerCase() as TransactionType, date: item.date?.split("T")[0] || "" }));
  }
  function exportPdf() {
    if (!data) return;
    exportFinancialReport({ userName: user?.name || "User", userEmail: user?.email || "", safeToSpend: data.forecast.projectedBalance, allowanceLabel: "Projected balance", totalIncome: data.summary.totalIncome, totalExpense: data.summary.totalExpenses, netBalance: data.summary.netCashFlow, transactions: mappedTransactions() });
  }
  function exportCsv() {
    const transactions = mappedTransactions();
    if (transactions.length === 0) {
      setExportNotice("No transactions match this period, so there is nothing to export.");
      return;
    }
    exportTransactionsCSV(transactions);
    setExportNotice(`${transactions.length} transaction${transactions.length === 1 ? "" : "s"} exported for this period.`);
  }

  return <div className="flex min-h-screen bg-[#f7f9f8]"><Sidebar /><main className="app-main">
    <header className="app-page-header mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4"><div><h1>Financial Review &amp; Analytics</h1><p className="mt-1 text-xs text-gray-500">Review your financial position, key risks, and trends for one consistent period.</p></div><div className="flex flex-wrap gap-2"><button onClick={exportCsv} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800">Export CSV</button><button onClick={exportPdf} className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white">Export PDF</button></div></header>
    <div className="mb-6 flex flex-wrap items-end gap-2 rounded-2xl border border-gray-200 bg-white p-4">{(["week", "month", "last-month", "custom"] as Period[]).map((option) => <button key={option} onClick={() => setPeriod(option)} className={`rounded-full px-4 py-2 text-xs font-bold ${period === option ? "bg-emerald-700 text-white" : "bg-gray-100 text-gray-600"}`}>{option.replace("-", " ")}</button>)}{period === "custom" && <><label className="text-[10px] font-bold uppercase text-gray-500">From<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="filter-input mt-1" /></label><label className="text-[10px] font-bold uppercase text-gray-500">To<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="filter-input mt-1" /></label></>}</div>
    {error && <p className="rounded-xl bg-red-50 p-4 text-xs text-red-700">{error}</p>}
    {exportNotice && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{exportNotice}</p>}
    {loading || !data ? <p className="py-16 text-center text-xs text-gray-400">Generating consistent period analytics…</p> : <>
      <p className="mb-4 text-xs text-slate-600">Reporting uses Asia/Manila calendar days. Forecasts linearly extend recorded spending and use received income; planned income is shown separately. Early bills can distort the projection.{typeof data.forecast.plannedProjectedBalance === "number" && <span> Using configured income, the planned remaining balance is ₱{data.forecast.plannedProjectedBalance.toLocaleString()}.</span>}{data.forecast.sparseData && " Limited history: treat this estimate cautiously."}</p>
      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Income received" value={data.summary.totalIncome} detail={`Recorded this period. Configured plan ₱${data.summary.configuredIncome.toLocaleString()}`} tone="emerald" /><Metric label="Loan principal collected" value={data.summary.loanCollections} detail="Cash returned from money you lent; excluded from income" tone="blue" /><Metric label="Spending & debt payments" value={data.summary.totalExpenses} detail={`${data.summary.expenseCount} spending movement${data.summary.expenseCount === 1 ? "" : "s"}`} tone="red" /><Metric label="Operating balance" value={data.summary.netCashFlow} detail="Income minus spending and debt payments; principal transfers excluded" tone={data.summary.netCashFlow < 0 ? "red" : "blue"} /><Metric label="Projected spending" value={data.forecast.projectedExpenses} detail={`Projected operating balance ₱${data.forecast.projectedBalance.toLocaleString()}`} tone="amber" /></section>
      <section className="mb-6 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm" aria-labelledby="financial-review-summary">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div><h2 id="financial-review-summary" className="text-base font-extrabold text-slate-950">Financial Review Summary</h2><p className="mt-1 text-xs text-slate-500">A concise interpretation of the selected period. Recommendations are based only on your recorded data.</p></div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${data.review.status.tone === "positive" ? "bg-emerald-100 text-emerald-800" : data.review.status.tone === "warning" ? "bg-amber-100 text-amber-800" : data.review.status.tone === "critical" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>{data.review.status.label}</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ReviewItem label="Financial status" value={data.review.status.detail} tone="emerald" />
          <ReviewItem label="Strongest area" value={data.review.strongestArea} tone="blue" />
          <ReviewItem label="Main concern" value={data.review.mainConcern} tone="amber" />
          <ReviewItem label="Recommended next action" value={data.review.recommendedAction} tone="violet" />
        </div>
      </section>
      <section className="mb-6 grid gap-6 lg:grid-cols-2">
        <IncomeExpenseChart trend={data.trend} start={data.period.start} end={data.period.end} income={data.summary.totalIncome} expense={data.summary.totalExpenses} />
        <article className="rounded-2xl border border-gray-200 bg-white p-6"><h2 className="text-sm font-bold">Spending by category</h2><div className="mt-4 grid grid-cols-2 items-center gap-4"><div className="relative"><svg viewBox="0 0 100 100" className="w-full -rotate-90">{donut.map((item) => <circle key={item.name} cx="50" cy="50" r="35" fill="transparent" stroke={item.color} strokeWidth="12" strokeDasharray={`${item.percentage} ${100 - item.percentage}`} strokeDashoffset={item.offset} pathLength="100" />)}</svg></div><div className="space-y-2">{donut.map((item) => <div key={item.name} className="flex justify-between gap-2 text-[10px]"><span><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: item.color }} />{item.name}</span><strong>{item.percentage}%</strong></div>)}</div></div></article>
      </section>
      <section className="mb-6 grid gap-4 md:grid-cols-3"><ProgressCard title="Budget usage" value={data.budget.percentage} amount={`${format(data.budget.spent)} of ${format(data.budget.target)}`} warning={data.budget.percentage >= 80} /><ProgressCard title="Savings progress" value={data.savings.percentage} amount={`${format(data.savings.saved)} of ${format(data.savings.target)}`} /><article className="rounded-2xl border border-gray-200 bg-white p-5"><p className="text-xs font-bold">Period comparison</p><p className={`mt-3 text-2xl font-extrabold ${data.comparison.expenseChangePct !== null && data.comparison.expenseChangePct > 0 ? "text-red-600" : "text-emerald-700"}`}>{data.comparison.expenseChangePct === null ? "New" : `${data.comparison.expenseChangePct > 0 ? "+" : ""}${data.comparison.expenseChangePct}%`}</p><p className="mt-1 text-[10px] text-gray-500">versus the previous equivalent period</p></article></section>
      <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-xs text-emerald-950"><strong className="block text-sm">Explainable insight</strong><p className="mt-2 leading-6">{data.topCategory ? `${data.topCategory.name} is your highest category at ${format(data.topCategory.amount)}, representing ${data.topCategory.percentage}% of expenses from ${new Date(data.period.start).toLocaleDateString("en-PH")} to ${new Date(data.period.end).toLocaleDateString("en-PH")}.` : "No expenses were recorded in this period."} {data.comparison.expenseChangePct !== null ? `Overall expenses are ${Math.abs(data.comparison.expenseChangePct)}% ${data.comparison.expenseChangePct > 0 ? "higher" : "lower"} than the previous equivalent period.` : "More history is needed for a comparison."}</p></article>
    </>}
  </main></div>;
}

function format(amount: number) { return `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`; }
function Metric({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: "emerald" | "red" | "blue" | "amber" }) { const colors = { emerald: "text-emerald-700", red: "text-red-600", blue: "text-blue-700", amber: "text-amber-700" }; return <article className="rounded-2xl border border-gray-200 bg-white p-5"><p className="text-xs text-gray-500">{label}</p><p className={`mt-2 text-2xl font-extrabold ${colors[tone]}`}>{format(value)}</p><p className="mt-1 text-[10px] text-gray-400">{detail}</p></article>; }
function ReviewItem({ label, value, tone }: { label: string; value: string; tone: "emerald" | "blue" | "amber" | "violet" }) { const accents = { emerald: "border-emerald-200 bg-emerald-50/60 text-emerald-800", blue: "border-blue-200 bg-blue-50/60 text-blue-800", amber: "border-amber-200 bg-amber-50/60 text-amber-800", violet: "border-violet-200 bg-violet-50/60 text-violet-800" }; return <article className={`rounded-2xl border p-4 ${accents[tone]}`}><p className="text-[10px] font-extrabold uppercase tracking-[0.12em]">{label}</p><p className="mt-2 text-xs leading-5 text-slate-700">{value}</p></article>; }
function ProgressCard({ title, value, amount, warning }: { title: string; value: number; amount: string; warning?: boolean }) { return <article className="rounded-2xl border border-gray-200 bg-white p-5"><div className="flex justify-between text-xs"><strong>{title}</strong><span>{value}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full ${warning ? "bg-amber-500" : "bg-emerald-600"}`} style={{ width: `${Math.min(100, value)}%` }} /></div><p className="mt-2 text-[10px] text-gray-500">{amount}</p></article>; }
