"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/ui/sidebar";
import { CATEGORIES } from "@/constants";
import type { Transaction, TransactionType } from "../types";
import { transactionService } from "@/services/transactionService";
import { incomeSetupService } from "@/services/incomeSetupService";
import { useAuth } from "@/context/Authcontext";
import { exportFinancialReport } from "@/lib/pdfExport";
import WalletSelector from "@/app/components/WalletSelector";

const expenseTypes = new Set<TransactionType>(["expense", "bill_payment", "debt_payment"]);
const incomeTypes = new Set<TransactionType>(["income", "loan_collection"]);
const CUSTOM_CATEGORY = "__custom_category__";

function transactionCategories(type: "expense" | "income") {
  return (type === "income" ? CATEGORIES.INCOME : CATEGORIES.EXPENSE)
    .filter((category) => !/^others?$/i.test(category));
}

function typeLabel(type: TransactionType) {
  return type.replaceAll("_", " ");
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [safeToSpend, setSafeToSpend] = useState(0);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense" | "transfer" | "adjustment">("all");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [modalMode, setModalMode] = useState<"expense" | "income" | "transfer" | "adjustment" | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      const [txData, setupData] = await Promise.all([transactionService.getTransactions(), incomeSetupService.getIncomeSetup()]);
      setTransactions(txData);
      setSafeToSpend(setupData.safeToSpend);
    } catch {
      setError("Unable to load your transaction history.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { const timer = window.setTimeout(() => void loadData(), 0); return () => window.clearTimeout(timer); }, []);

  const filtered = useMemo(() => transactions.filter((transaction) => {
    const typeMatches = filterType === "all" || (filterType === "income" ? incomeTypes.has(transaction.type) : filterType === "expense" ? expenseTypes.has(transaction.type) : transaction.type === filterType);
    const date = new Date(transaction.date);
    return typeMatches && (selectedCategory === "All Categories" || transaction.category === selectedCategory)
      && (!startDate || date >= new Date(startDate)) && (!endDate || date <= new Date(`${endDate}T23:59:59`))
      && (!minAmount || transaction.amount >= Number(minAmount)) && (!maxAmount || transaction.amount <= Number(maxAmount));
  }), [transactions, filterType, selectedCategory, startDate, endDate, minAmount, maxAmount]);

  const totalIncome = filtered.filter((item) => incomeTypes.has(item.type)).reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = filtered.filter((item) => expenseTypes.has(item.type)).reduce((sum, item) => sum + item.amount, 0);

  async function saveTransaction(transaction: Omit<Transaction, "id">) {
    try {
      setError("");
      if (editing) await transactionService.updateTransaction(editing.id, transaction);
      else await transactionService.createTransaction(transaction);
      setEditing(null); setModalMode(null); setNotice(editing ? "Transaction updated." : "Transaction recorded.");
      await loadData();
    } catch {
      setError("The transaction could not be saved. Check the selected accounts and values.");
    }
  }
  async function remove(id: string) {
    if (!confirm("Move this transaction to audit history?")) return;
    await transactionService.deleteTransaction(id); setNotice("Transaction removed. You can review its audit history on the server."); await loadData();
  }
  async function undoLast() {
    if (!confirm("Undo your most recent transaction?")) return;
    try { const result = await transactionService.undoLastTransaction(); setNotice(result.message); await loadData(); } catch { setError("No transaction could be undone."); }
  }

  function clearFilters() { setFilterType("all"); setSelectedCategory("All Categories"); setStartDate(""); setEndDate(""); setMinAmount(""); setMaxAmount(""); }
  function exportPdf() { exportFinancialReport({ userName: user?.name || "User", userEmail: user?.email || "", safeToSpend, totalIncome, totalExpense, netBalance: totalIncome - totalExpense, transactions: filtered }); }

  return (
    <div className="flex min-h-screen bg-[#f7f9f8]"><Sidebar /><main className="app-main">
      <header className="app-page-header app-page-header--sticky mb-6 flex flex-col gap-4 border-b border-gray-200/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1>Transaction History</h1><p className="mt-1 text-xs text-gray-500">Every recorded movement is linked to its account and retained in an audit trail.</p></div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportPdf} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">Export PDF</button>
          <button onClick={() => void undoLast()} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700">Undo last</button>
          <button onClick={() => setModalMode("transfer")} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800">Transfer</button>
          <button onClick={() => setModalMode("adjustment")} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">Adjust balance</button>
          <button onClick={() => setModalMode("expense")} className="rounded-xl bg-[#186849] px-4 py-2 text-xs font-bold text-white">+ Add transaction</button>
        </div>
      </header>
      {notice && <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">{notice}</p>}
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}

      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4">
        <Filter label="Movement"><select value={filterType} onChange={(event) => setFilterType(event.target.value as typeof filterType)} className="filter-input"><option value="all">All</option><option value="income">Income</option><option value="expense">Expenses</option><option value="transfer">Transfers</option><option value="adjustment">Adjustments</option></select></Filter>
        <Filter label="Category"><select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="filter-input"><option>All Categories</option>{[...new Set(transactions.map((item) => item.category))].map((category) => <option key={category}>{category}</option>)}</select></Filter>
        <Filter label="From"><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="filter-input" /></Filter>
        <Filter label="To"><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="filter-input" /></Filter>
        <Filter label="Min ₱"><input type="number" min="0" value={minAmount} onChange={(event) => setMinAmount(event.target.value)} className="filter-input w-24" /></Filter>
        <Filter label="Max ₱"><input type="number" min="0" value={maxAmount} onChange={(event) => setMaxAmount(event.target.value)} className="filter-input w-24" /></Filter>
        <button onClick={clearFilters} className="mb-0.5 text-xs font-semibold text-gray-500 underline">Reset</button>
      </div>
      <section className="mb-5 grid gap-4 sm:grid-cols-3"><Metric label="Income" value={totalIncome} tone="text-emerald-700" /><Metric label="Expenses" value={totalExpense} tone="text-red-600" /><Metric label="Net cash flow" value={totalIncome - totalExpense} tone={totalIncome - totalExpense < 0 ? "text-red-600" : "text-blue-700"} /></section>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? <p className="p-10 text-center text-xs text-gray-400">Loading transactions…</p> : <table className="w-full text-left text-xs"><thead className="border-b bg-gray-50"><tr>{["Date", "Description", "Category", "Account movement", "Type", "Amount", "Actions"].map((heading) => <th key={heading} className="p-4">{heading}</th>)}</tr></thead><tbody className="divide-y">
          {filtered.map((item) => <tr key={item.id} className="hover:bg-gray-50"><td className="p-4 text-gray-500">{item.date}</td><td className="p-4 font-semibold">{item.description}</td><td className="p-4">{item.category}</td><td className="p-4">{item.wallet?.name || "Unassigned"}{item.destinationWallet ? ` → ${item.destinationWallet.name}` : ""}</td><td className="p-4 capitalize">{typeLabel(item.type)}</td><td className={`p-4 font-bold ${incomeTypes.has(item.type) ? "text-emerald-700" : expenseTypes.has(item.type) ? "text-red-600" : "text-blue-700"}`}>{item.type === "transfer" ? "" : incomeTypes.has(item.type) ? "+" : expenseTypes.has(item.type) ? "−" : ""}₱{item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td><td className="p-4"><div className="flex gap-2">{["income", "expense", "adjustment"].includes(item.type) && <button onClick={() => { setEditing(item); setModalMode(item.type as "income" | "expense" | "adjustment"); }} className="font-bold text-blue-600">Edit</button>}<button onClick={() => void remove(item.id)} className="font-bold text-red-600">Delete</button></div></td></tr>)}
          {filtered.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-gray-400">No matching movements.</td></tr>}
        </tbody></table>}
      </div>
    </main>
    {modalMode && <TransactionModal mode={modalMode} initial={editing} onClose={() => { setModalMode(null); setEditing(null); }} onSave={saveTransaction} />}
    </div>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1 text-[10px] font-bold uppercase text-gray-500">{label}{children}</label>; }
function Metric({ label, value, tone }: { label: string; value: number; tone: string }) { return <div className="rounded-2xl border border-gray-200 bg-white p-5"><p className="text-xs text-gray-500">{label}</p><p className={`mt-1 text-2xl font-extrabold ${tone}`}>₱{value.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p></div>; }

function TransactionModal({ mode, initial, onClose, onSave }: { mode: "expense" | "income" | "transfer" | "adjustment"; initial: Transaction | null; onClose: () => void; onSave: (transaction: Omit<Transaction, "id">) => Promise<void> }) {
  const [type, setType] = useState<"expense" | "income">(mode === "income" ? "income" : "expense");
  const [description, setDescription] = useState(initial?.description || "");
  const initialCategories = transactionCategories(mode === "income" ? "income" : "expense");
  const initialUsesCustomCategory = Boolean(initial?.category && !initialCategories.includes(initial.category));
  const [category, setCategory] = useState(initialUsesCustomCategory ? CUSTOM_CATEGORY : initial?.category || initialCategories[0]);
  const [customCategory, setCustomCategory] = useState(initialUsesCustomCategory ? initial?.category || "" : "");
  const [amount, setAmount] = useState(initial?.amount.toString() || "");
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0, 10));
  const [walletId, setWalletId] = useState<string | null>(initial?.walletId || null);
  const [destinationWalletId, setDestinationWalletId] = useState<string | null>(initial?.destinationWalletId || null);
  const [adjustmentDirection, setAdjustmentDirection] = useState<"Balance Increase" | "Balance Decrease">(initial?.category === "Balance Decrease" ? "Balance Decrease" : "Balance Increase");
  const [saving, setSaving] = useState(false);
  const effectiveType: TransactionType = mode === "transfer" ? "transfer" : mode === "adjustment" ? "adjustment" : type;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!walletId || (mode === "transfer" && !destinationWalletId)) return;
    const selectedCategory = category === CUSTOM_CATEGORY ? customCategory.trim() : category;
    if (mode !== "transfer" && mode !== "adjustment" && !selectedCategory) return;
    setSaving(true);
    await onSave({
      type: effectiveType,
      description: description.trim() || (mode === "transfer" ? "Wallet transfer" : mode === "adjustment" ? "Balance adjustment" : selectedCategory),
      category: mode === "transfer" ? "Transfer" : mode === "adjustment" ? adjustmentDirection : selectedCategory,
      amount: Number(amount), date, walletId, destinationWalletId: mode === "transfer" ? destinationWalletId : null,
    });
    setSaving(false);
  }
  const categories = transactionCategories(type);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"><form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-6 text-xs shadow-2xl">
    <h2 className="mb-1 text-lg font-bold capitalize">{initial ? "Edit" : mode === "transfer" ? "Transfer between wallets" : mode === "adjustment" ? "Adjust wallet balance" : "Record transaction"}</h2><p className="mb-5 text-gray-500">Every change will be reflected in wallet balances and retained in the audit trail.</p>
    {!initial && mode !== "transfer" && mode !== "adjustment" && <div className="mb-4 flex gap-2">{(["expense", "income"] as const).map((option) => <button key={option} type="button" onClick={() => { setType(option); setCategory(transactionCategories(option)[0]); setCustomCategory(""); }} className={`flex-1 rounded-xl py-2 font-bold capitalize ${type === option ? "bg-emerald-700 text-white" : "bg-gray-100"}`}>{option}</button>)}</div>}
    <label className="field-label">Description</label><input value={description} onChange={(event) => setDescription(event.target.value)} required className="field-input" placeholder="What happened?" />
    {mode !== "transfer" && mode !== "adjustment" && <><label className="field-label">Category</label><select value={category} onChange={(event) => setCategory(event.target.value)} className="field-input">{categories.map((item) => <option key={item}>{item}</option>)}<option value={CUSTOM_CATEGORY}>Enter custom category...</option></select>{category === CUSTOM_CATEGORY && <input value={customCategory} onChange={(event) => setCustomCategory(event.target.value)} required maxLength={50} autoFocus className="field-input mt-2" placeholder="Type your category" />}</>}
    {mode === "adjustment" && <><label className="field-label">Adjustment direction</label><select value={adjustmentDirection} onChange={(event) => setAdjustmentDirection(event.target.value as typeof adjustmentDirection)} className="field-input"><option>Balance Increase</option><option>Balance Decrease</option></select></>}
    <div className="grid grid-cols-2 gap-3"><div><label className="field-label">Amount</label><input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required className="field-input" /></div><div><label className="field-label">Date</label><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required className="field-input" /></div></div>
    <div className="mt-3"><WalletSelector value={walletId} onChange={setWalletId} label={mode === "transfer" ? "Source wallet" : "Account"} /></div>
    {mode === "transfer" && <div className="mt-3"><WalletSelector value={destinationWalletId} onChange={setDestinationWalletId} label="Destination wallet" excludeId={walletId} /></div>}
    <div className="mt-6 flex gap-3"><button type="button" onClick={onClose} className="flex-1 rounded-xl border py-2.5 font-bold">Cancel</button><button type="submit" disabled={saving} className="flex-1 rounded-xl bg-emerald-700 py-2.5 font-bold text-white disabled:opacity-50">{saving ? "Saving…" : initial ? "Save changes" : "Record"}</button></div>
  </form></div>;
}
