"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CircleDollarSign,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  Smartphone,
  Trash2,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";
import Sidebar from "@/app/components/ui/sidebar";
import { walletService } from "@/services/walletService";
import type { AccountType, Wallet, WalletInput } from "@/app/types";

const ACCOUNT_TYPES: Array<{
  value: AccountType;
  label: string;
  icon: WalletInput["icon"];
}> = [
  { value: "CASH", label: "Cash", icon: "wallet" },
  { value: "BANK", label: "Bank account", icon: "bank" },
  { value: "EWALLET", label: "E-wallet", icon: "phone" },
  { value: "CREDIT_CARD", label: "Credit card", icon: "card" },
  { value: "INVESTMENT", label: "Investment", icon: "chart" },
  { value: "OTHER", label: "Other", icon: "other" },
];

const COLORS = ["#0f766e", "#047857", "#0284c7", "#7c3aed", "#c2410c", "#be123c"];

const ICONS = {
  wallet: WalletCards,
  bank: Landmark,
  phone: Smartphone,
  card: CreditCard,
  chart: TrendingUp,
  other: CircleDollarSign,
};

const EMPTY_FORM: WalletInput = {
  name: "",
  institution: "",
  accountType: "CASH",
  kind: "ASSET",
  openingBalance: 0,
  icon: "wallet",
  color: COLORS[0],
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}

function accountLabel(type: AccountType) {
  return ACCOUNT_TYPES.find((option) => option.value === type)?.label || "Other";
}

function requestError(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Wallet | null>(null);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setAccounts(await walletService.getWallets());
    } catch (reason) {
      setError(requestError(reason, "Unable to load your accounts."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    walletService
      .getWallets()
      .then((data) => {
        if (active) setAccounts(data);
      })
      .catch((reason) => {
        if (active) setError(requestError(reason, "Unable to load your accounts."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(() => {
    const assets = accounts
      .filter((account) => account.kind === "ASSET")
      .reduce((total, account) => total + account.balance, 0);
    const liabilities = accounts
      .filter((account) => account.kind === "LIABILITY")
      .reduce((total, account) => total + account.balance, 0);
    return { assets, liabilities, netWorth: assets - liabilities };
  }, [accounts]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(account: Wallet) {
    setEditing(account);
    setModalOpen(true);
  }

  async function deleteAccount(account: Wallet) {
    const confirmed = window.confirm(
      `Delete "${account.name}"? Existing transactions will remain in your history as unassigned.`,
    );
    if (!confirmed) return;

    try {
      await walletService.deleteWallet(account.id);
      await loadAccounts();
    } catch (reason) {
      setError(requestError(reason, "Unable to delete the account."));
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f7f9f8]">
      <Sidebar />
      <main className="app-main">
        <header className="app-page-header app-page-header--sticky mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200/70 pb-5">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Manual tracking</p>
            <h1>Wallet & Accounts</h1>
            <p className="mt-1 text-xs text-gray-500">
              Organize cash, bank, e-wallet, investment, and credit balances without connecting to a financial institution.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-[#186849] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#13543b]"
          >
            <Plus size={16} /> Add account
          </button>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <SummaryCard label="Total assets" value={totals.assets} tone="emerald" />
          <SummaryCard label="Total liabilities" value={totals.liabilities} tone="rose" />
          <SummaryCard label="Net worth" value={totals.netWorth} tone={totals.netWorth < 0 ? "rose" : "blue"} />
        </section>

        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          These balances are records you maintain in Casha-Ba. The system does not sign in to your bank, e-wallet, or investment provider and cannot move real money.
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-48 animate-pulse rounded-2xl bg-gray-200/70" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <WalletCards className="mx-auto mb-4 text-emerald-700" size={38} />
            <h2 className="text-base font-bold text-gray-900">Create your first account</h2>
            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-gray-500">
              Add a manually tracked cash wallet, bank account, or e-wallet. You can then assign new transactions to it.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-5 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-800"
            >
              Add account
            </button>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {accounts.map((account) => {
              const AccountIcon = ICONS[account.icon] || CircleDollarSign;
              return (
                <article
                  key={account.id}
                  className="relative overflow-hidden rounded-2xl p-5 text-white shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${account.color}, ${account.color}cc)` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15">
                        <AccountIcon size={20} />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-bold">{account.name}</h2>
                        <p className="truncate text-[11px] text-white/75">
                          {account.institution || accountLabel(account.accountType)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => openEdit(account)} className="rounded-lg p-2 text-white/80 hover:bg-white/15 hover:text-white" aria-label={`Edit ${account.name}`}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" onClick={() => void deleteAccount(account)} className="rounded-lg p-2 text-white/80 hover:bg-white/15 hover:text-white" aria-label={`Delete ${account.name}`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-8">
                    <span className="rounded-full bg-white/15 px-2 py-1 text-[9px] font-bold uppercase tracking-wider">
                      {account.kind === "LIABILITY" ? "Amount owed" : "Recorded balance"}
                    </span>
                    <p className="mt-2 text-2xl font-bold tracking-tight">{formatCurrency(account.balance)}</p>
                    <p className="mt-1 text-[10px] text-white/70">
                      Opening balance {formatCurrency(account.openingBalance)}
                    </p>
                    <p className="mt-1 text-[10px] text-white/70">Updated {new Date(account.updatedAt || account.createdAt).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {modalOpen && (
        <AccountModal
          account={editing}
          onClose={() => setModalOpen(false)}
          onSaved={async () => {
            setModalOpen(false);
            await loadAccounts();
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "rose" | "blue";
}) {
  const tones = {
    emerald: "border-emerald-200 text-emerald-700",
    rose: "border-rose-200 text-rose-600",
    blue: "border-blue-200 text-blue-700",
  };
  return (
    <div className={`rounded-2xl border-t-4 bg-white p-5 shadow-sm ${tones[tone]}`}>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{formatCurrency(value)}</p>
    </div>
  );
}

function AccountModal({
  account,
  onClose,
  onSaved,
}: {
  account: Wallet | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<WalletInput>(
    account
      ? {
          name: account.name,
          institution: account.institution || "",
          accountType: account.accountType,
          kind: account.kind,
          openingBalance: account.openingBalance,
          icon: account.icon,
          color: account.color,
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function selectType(accountType: AccountType) {
    const option = ACCOUNT_TYPES.find((item) => item.value === accountType)!;
    setForm((current) => ({
      ...current,
      accountType,
      icon: option.icon,
      kind: accountType === "CREDIT_CARD" ? "LIABILITY" : current.kind,
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (account) await walletService.updateWallet(account.id, form);
      else await walletService.createWallet(form);
      await onSaved();
    } catch (reason) {
      setError(requestError(reason, "Unable to save the account."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 px-4 py-8">
      <form onSubmit={submit} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{account ? "Edit account" : "Add account"}</h2>
            <p className="mt-1 text-xs text-gray-500">Enter a balance you want to track manually.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

        <label className="mb-1 block text-xs font-semibold text-gray-700">Account name</label>
        <input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="e.g. Daily cash or Savings"
          maxLength={60}
          required
          className="mb-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <label className="mb-2 block text-xs font-semibold text-gray-700">Account type</label>
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ACCOUNT_TYPES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => selectType(option.value)}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                form.accountType === option.value
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">Institution (optional)</label>
            <input
              value={form.institution || ""}
              onChange={(event) => setForm({ ...form, institution: event.target.value })}
              placeholder="e.g. Your bank or e-wallet"
              maxLength={80}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              {form.kind === "LIABILITY" ? "Current amount owed" : "Opening balance"}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.openingBalance}
              onChange={(event) => setForm({ ...form, openingBalance: Number(event.target.value) })}
              required
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <label className="mb-2 mt-4 block text-xs font-semibold text-gray-700">Balance classification</label>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {(["ASSET", "LIABILITY"] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setForm({ ...form, kind })}
              className={`rounded-xl border px-3 py-2.5 text-xs font-semibold ${
                form.kind === kind
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              {kind === "ASSET" ? "Asset - money you have" : "Liability - money you owe"}
            </button>
          ))}
        </div>

        <label className="mb-2 block text-xs font-semibold text-gray-700">Card color</label>
        <div className="mb-6 flex gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setForm({ ...form, color })}
              aria-label={`Use color ${color}`}
              className={`h-8 w-8 rounded-full border-2 ${form.color === color ? "border-gray-900" : "border-white"}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onClose} disabled={saving} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
            {saving ? "Saving..." : account ? "Save changes" : "Create account"}
          </button>
        </div>
      </form>
    </div>
  );
}
