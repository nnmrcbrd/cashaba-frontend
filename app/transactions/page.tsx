"use client";

import { useState } from "react";
import Sidebar from "../components/ui/sidebar";
import { CATEGORIES } from "@/constants/index";
import { Transaction, TransactionType } from "../types/index";

const INITIAL: Transaction[] = [
  { id: "1", type: "income", category: "Salary", amount: 45000, date: "2026-07-01" },
  { id: "2", type: "expense", category: "Food", amount: 1240, date: "2026-07-06" },
  { id: "3", type: "expense", category: "Utilities", amount: 2100, date: "2026-06-29" },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL);
  const [filter, setFilter] = useState<"all" | TransactionType>("all");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = transactions.filter((t) => filter === "all" || t.type === filter);

  function addTransaction(t: Omit<Transaction, "id">) {
    setTransactions((prev) => [{ ...t, id: crypto.randomUUID() }, ...prev]);
    setModalOpen(false);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-50 p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-900">Transactions</h1>
            <p className="text-sm text-gray-500">All your income and expenses.</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="btn-primary w-auto px-5">
            + Add transaction
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          {(["all", "income", "expense"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize ${
                filter === f ? "bg-brand-600 text-white" : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="card">
          <ul className="divide-y divide-gray-100">
            {filtered.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3 text-sm">
                <span className="text-gray-700">{t.category}</span>
                <span className="text-gray-400">{t.date}</span>
                <span className={`font-semibold ${t.type === "income" ? "text-brand-600" : "text-red-500"}`}>
                  {t.type === "income" ? "+" : "-"}₱{t.amount.toLocaleString()}
                </span>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="py-6 text-center text-sm text-gray-400">No transactions yet.</li>
            )}
          </ul>
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
  const [amount, setAmount] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      type,
      category,
      amount: Number(amount),
      date: new Date().toISOString().slice(0, 10),
    });
  }

  const categoryList = type === "income" ? CATEGORIES.INCOME : CATEGORIES.EXPENSE;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-bold text-brand-900">Add transaction</h2>

        <div className="mb-4 flex gap-2">
          {(["expense", "income"] as const).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => {
                setType(t);
                setCategory(t === "income" ? CATEGORIES.INCOME[0] : CATEGORIES.EXPENSE[0]);
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize ${
                type === t ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-xs font-semibold text-gray-600">Category</label>
        <select
          className="input mb-4"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categoryList.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label className="mb-1 block text-xs font-semibold text-gray-600">Amount</label>
        <input
          className="input mb-6"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600">
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}