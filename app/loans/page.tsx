"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/ui/sidebar";
import { loanService, Loan, LoanSummary } from "@/services/loanService";

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoanSummary>({ totalBorrowed: 0, totalLent: 0, overdueCount: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "BORROWED" | "LENT">("ALL");

  useEffect(() => {
    loadLoans();
  }, []);

  async function loadLoans() {
    try {
      setLoading(true);
      const data = await loanService.getLoans();
      setLoans(data.loans);
      setSummary(data.summary);
    } catch (err) {
      console.error("Failed to load loans", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddLoan(loanData: { title: string; amount: number; type: "BORROWED" | "LENT"; deadline: string }) {
    try {
      await loanService.createLoan(loanData);
      setModalOpen(false);
      loadLoans();
    } catch (err) {
      console.error("Failed to add loan", err);
    }
  }

  async function handleToggleStatus(id: string, currentStatus: string) {
    try {
      const nextStatus = currentStatus === "PAID_OFF" ? "ACTIVE" : "PAID_OFF";
      await loanService.updateLoanStatus(id, nextStatus);
      loadLoans();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this loan entry?")) return;
    try {
      await loanService.deleteLoan(id);
      setLoans((prev) => prev.filter((l) => l.id !== id));
      loadLoans();
    } catch (err) {
      console.error("Failed to delete loan", err);
    }
  }

  const filteredLoans = loans.filter((l) => {
    if (filter === "BORROWED") return l.type === "BORROWED";
    if (filter === "LENT") return l.type === "LENT";
    return true;
  });

  return (
    <div className="flex min-h-screen bg-[#f7faf8]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/60">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">DEBTS & LOANS</h1>
            <p className="text-xs text-gray-500 mt-1">Track financial obligations, borrowed funds, and money lent.</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-[#186849] hover:bg-[#13543b] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
          >
            <span>+</span> Add Loan / Debt
          </button>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm border-t-4 border-t-rose-500">
            <p className="text-xs font-medium text-gray-500">Total Owed (Borrowed)</p>
            <p className="mt-2 text-2xl font-bold text-rose-600">₱{summary.totalBorrowed.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
            <p className="mt-1 text-[11px] text-gray-400">Active debts to pay</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm border-t-4 border-t-emerald-600">
            <p className="text-xs font-medium text-gray-500">Total Owed to You (Lent)</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">₱{summary.totalLent.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
            <p className="mt-1 text-[11px] text-gray-400">Money to collect</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm border-t-4 border-t-amber-500">
            <p className="text-xs font-medium text-gray-500">Overdue Debts</p>
            <p className="mt-2 text-2xl font-bold text-amber-700">{summary.overdueCount}</p>
            <p className="mt-1 text-[11px] text-gray-400">Passed deadline</p>
          </div>
        </div>

        {/* Overdue Warning Alert */}
        {summary.overdueCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-xs text-amber-800 font-semibold mb-6">
            <span>⚠️</span>
            <span>You have <strong>{summary.overdueCount} overdue</strong> debt entries! Please review deadlines.</span>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {(["ALL", "BORROWED", "LENT"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition shadow-sm ${
                  filter === f
                    ? "bg-[#186849] text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {f === "ALL" ? "All Entries" : f === "BORROWED" ? "I Owe (Borrowed)" : "Lent to Others"}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-500">{filteredLoans.length} entries</span>
        </div>

        {/* Loans List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading loan data...</div>
        ) : filteredLoans.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center max-w-md mx-auto my-6">
            <p className="text-3xl mb-2">🤝</p>
            <h3 className="text-sm font-bold text-gray-800 mb-1">No Loans or Debts Recorded</h3>
            <p className="text-xs text-gray-500 mb-4">Add your borrowed or lent money to track obligations.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-[#186849] text-white px-5 py-2.5 rounded-xl text-xs font-semibold"
            >
              + Add Loan / Debt
            </button>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {filteredLoans.map((l) => {
              const isOverdue = l.status === "OVERDUE";
              const isPaid = l.status === "PAID_OFF";
              const deadlineDate = l.deadline ? new Date(l.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A";

              return (
                <div key={l.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative group">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl shrink-0 ${
                      l.type === "BORROWED" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                    }`}>
                      {l.type === "BORROWED" ? "💸" : "🤝"}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-bold text-gray-900">{l.title}</h3>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isPaid
                              ? "bg-gray-100 text-gray-600"
                              : isOverdue
                              ? "bg-red-100 text-red-700 animate-pulse"
                              : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {l.status}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-400 border border-gray-200 px-2 py-0.5 rounded-md">
                            {l.type === "BORROWED" ? "You Owe" : "Lent"}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDelete(l.id)}
                          className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition text-xs"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex items-baseline justify-between mt-3 text-xs">
                        <div>
                          <p className="text-gray-500 font-medium mb-1">Amount</p>
                          <p className={`text-lg font-bold ${l.type === "BORROWED" ? "text-rose-600" : "text-emerald-600"}`}>
                            ₱{l.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-gray-500 font-medium mb-1">Due Date</p>
                          <p className={`text-xs font-bold ${isOverdue ? "text-red-600" : "text-gray-800"}`}>
                            {deadlineDate}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleToggleStatus(l.id, l.status)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition border ${
                            isPaid
                              ? "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-sm"
                          }`}
                        >
                          {isPaid ? "Mark as Active" : "✓ Mark as Paid Off"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Loan Modal */}
      {modalOpen && (
        <AddLoanModal onClose={() => setModalOpen(false)} onSave={handleAddLoan} />
      )}
    </div>
  );
}

function AddLoanModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: { title: string; amount: number; type: "BORROWED" | "LENT"; deadline: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"BORROWED" | "LENT">("BORROWED");
  const [deadline, setDeadline] = useState(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !amount) return;
    onSave({
      title: title.trim(),
      amount: Number(amount),
      type,
      deadline,
    });
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 px-4 z-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg text-xs">
        <h2 className="mb-4 text-sm font-bold text-gray-900">Add Loan / Debt Record</h2>

        <label className="mb-1 block font-semibold text-gray-700">Type</label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setType("BORROWED")}
            className={`py-2 rounded-xl text-xs font-bold border transition ${
              type === "BORROWED" ? "bg-rose-500 text-white border-rose-500" : "bg-gray-50 border-gray-200 text-gray-600"
            }`}
          >
            I Owe (Borrowed)
          </button>
          <button
            type="button"
            onClick={() => setType("LENT")}
            className={`py-2 rounded-xl text-xs font-bold border transition ${
              type === "LENT" ? "bg-emerald-600 text-white border-emerald-600" : "bg-gray-50 border-gray-200 text-gray-600"
            }`}
          >
            Lent to Someone
          </button>
        </div>

        <label className="mb-1 block font-semibold text-gray-700">Title / Person Name</label>
        <input
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="e.g. Motor Loan, Owe Anna"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label className="mb-1 block font-semibold text-gray-700">Total Amount (₱)</label>
        <input
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="number"
          placeholder="2000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <label className="mb-1 block font-semibold text-gray-700">Due Date</label>
        <input
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-6 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          required
        />

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 font-semibold text-gray-600">
            Cancel
          </button>
          <button type="submit" className="flex-1 bg-[#186849] hover:bg-[#13543b] text-white rounded-xl py-2.5 font-semibold">
            Save Record
          </button>
        </div>
      </form>
    </div>
  );
}
