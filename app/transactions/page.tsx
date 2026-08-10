"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/ui/sidebar";
import { CATEGORIES } from "@/constants/index";
import { Transaction, TransactionType } from "../types/index";
import { transactionService } from "@/services/transactionService";
import { incomeSetupService } from "@/services/incomeSetupService";
import { useAuth } from "@/context/Authcontext";
import { exportFinancialReport } from "@/lib/pdfExport";

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [safeToSpend, setSafeToSpend] = useState(0);
  const [filterType, setFilterType] = useState<"all" | TransactionType>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  
  // Advanced Range Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [txData, setupData] = await Promise.all([
        transactionService.getTransactions(),
        incomeSetupService.getIncomeSetup(),
      ]);
      setTransactions(txData);
      setSafeToSpend(setupData.safeToSpend);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = transactions.filter((t) => {
    // Type filter
    const matchesType = filterType === "all" || t.type === filterType;
    
    // Category filter
    const matchesCategory = selectedCategory === "All Categories" || t.category === selectedCategory;
    
    // Date filter
    const txDate = new Date(t.date);
    const matchesStartDate = !startDate || txDate >= new Date(startDate);
    const matchesEndDate = !endDate || txDate <= new Date(endDate);

    // Amount range filter
    const matchesMinAmount = !minAmount || t.amount >= Number(minAmount);
    const matchesMaxAmount = !maxAmount || t.amount <= Number(maxAmount);

    return matchesType && matchesCategory && matchesStartDate && matchesEndDate && matchesMinAmount && matchesMaxAmount;
  });

  const totalIncome = filtered.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const net = totalIncome - totalExpense;

  async function addTransaction(t: Omit<Transaction, "id">) {
    try {
      await transactionService.createTransaction(t);
      loadData();
      setModalOpen(false);
    } catch (err) {
      console.error("Failed to add transaction", err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await transactionService.deleteTransaction(id);
      loadData();
    } catch (err) {
      console.error("Failed to delete transaction", err);
    }
  }

  function handleExportPDF() {
    exportFinancialReport({
      userName: user?.name || "User",
      userEmail: user?.email || "",
      safeToSpend,
      totalIncome,
      totalExpense,
      netBalance: net,
      transactions: filtered,
    });
  }

  function clearFilters() {
    setFilterType("all");
    setSelectedCategory("All Categories");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
  }

  return (
    <div className="flex min-h-screen bg-[#f7faf8]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/60">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">TRANSACTIONS</h1>
            <p className="text-xs text-gray-500 mt-1">Log expenses, track income, and export reports.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <span>📄</span> Export PDF Report
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-[#186849] hover:bg-[#13543b] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <span>+</span> Add Transaction
            </button>
          </div>
        </div>

        {/* Type Switcher Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-6 border-b border-gray-200 pb-2">
            {(["all", "income", "expense"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`text-sm font-bold capitalize transition pb-2 -mb-2 ${
                  filterType === f
                    ? "text-emerald-700 border-b-2 border-emerald-700"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>

          <button
            onClick={clearFilters}
            className="text-xs font-semibold text-gray-500 hover:text-red-600 underline"
          >
            Reset Filters
          </button>
        </div>

        {/* Filter Bar (Category, Date Range, Amount Range) */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Category Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option>All Categories</option>
                {Array.from(new Set([...CATEGORIES.EXPENSE, ...CATEGORIES.INCOME])).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Min Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Min ₱</label>
              <input
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-24 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Max Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Max ₱</label>
              <input
                type="number"
                placeholder="10000"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="w-24 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6 grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Income (Filtered)</p>
            <p className="text-2xl font-bold text-emerald-600">₱{totalIncome.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Expense (Filtered)</p>
            <p className="text-2xl font-bold text-red-500">₱{totalExpense.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Net</p>
            <p className="text-2xl font-bold text-emerald-600">₱{net.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400">Loading transactions...</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/50 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 text-gray-500">{t.date}</td>
                    <td className="p-4 font-semibold text-gray-900">{t.description || t.category}</td>
                    <td className="p-4 text-gray-600">{t.category}</td>
                    <td className="p-4 text-gray-600 capitalize">{t.type}</td>
                    <td className={`p-4 font-bold ${t.type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                      {t.type === "income" ? "+" : "-"}₱{t.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-gray-400 hover:text-red-600 font-bold px-2 py-1 transition"
                        title="Delete transaction"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      No transactions match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* Footer stats */}
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Showing {filtered.length} of {transactions.length} total transactions</span>
          </div>
        </div>
      </main>

      {modalOpen && (
        <AddTransactionModal onClose={() => setModalOpen(false)} onSave={addTransaction} />
      )}
    </div>
  );
}

function AddTransactionModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (t: Omit<Transaction, "id">) => void;
}) {
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState(CATEGORIES.EXPENSE[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      type,
      category,
      description: description.trim() || category,
      amount: Number(amount),
      date: new Date().toISOString().slice(0, 10),
    });
  }

  const categoryList = type === "income" ? CATEGORIES.INCOME : CATEGORIES.EXPENSE;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 px-4 z-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg text-xs">
        <h2 className="mb-4 text-sm font-bold text-gray-900">Add Transaction</h2>

        <div className="mb-4 flex gap-2">
          {(["expense", "income"] as const).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => {
                setType(t);
                setCategory(t === "income" ? CATEGORIES.INCOME[0] : CATEGORIES.EXPENSE[0]);
              }}
              className={`flex-1 rounded-xl py-2 text-xs font-semibold capitalize transition ${
                type === t ? "bg-[#186849] text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <label className="mb-1 block font-semibold text-gray-700">Description</label>
        <input
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="text"
          placeholder="e.g. Jollibee, Salary, Grab"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <label className="mb-1 block font-semibold text-gray-700">Category</label>
        <select
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categoryList.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label className="mb-1 block font-semibold text-gray-700">Amount (₱)</label>
        <input
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-6 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 font-semibold text-gray-600">
            Cancel
          </button>
          <button type="submit" className="flex-1 bg-[#186849] hover:bg-[#13543b] text-white rounded-xl py-2.5 font-semibold">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}