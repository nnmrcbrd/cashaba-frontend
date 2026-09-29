"use client";

import { useEffect, useState } from "react";
import { walletService } from "@/services/walletService";
import type { Wallet } from "@/app/types";

interface WalletSelectorProps {
  value?: string | null;
  onChange: (walletId: string | null) => void;
  label?: string;
  required?: boolean;
  excludeId?: string | null;
  kind?: Wallet["kind"];
}

export default function WalletSelector({ value, onChange, label = "Account / payment source", required = true, excludeId, kind }: WalletSelectorProps) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    walletService
      .getWallets()
      .then(setWallets)
      .catch(() => setWallets([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <label className="mb-1 block font-semibold text-gray-700">{label}</label>
      {loading ? (
        <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
      ) : (
        <select
          value={value || ""}
          onChange={(event) => onChange(event.target.value || null)}
          required={required}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Select an account</option>
          {wallets.filter((wallet) => wallet.id !== excludeId && (!kind || wallet.kind === kind)).map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name}{wallet.institution ? ` - ${wallet.institution}` : ""}
            </option>
          ))}
        </select>
      )}
      {!loading && wallets.length === 0 && (
        <p className="mt-1 text-[10px] text-gray-400">Create an account from Wallet & Accounts to assign transactions.</p>
      )}
    </div>
  );
}
