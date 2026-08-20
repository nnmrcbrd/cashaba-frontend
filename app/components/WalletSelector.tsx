"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";

interface Wallet {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface WalletSelectorProps {
  value?: string | null;
  onChange: (walletId: string | null) => void;
}

export default function WalletSelector({ value, onChange }: WalletSelectorProps) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWallets() {
      try {
        const res = await apiClient.get("/wallets");
        setWallets(res.data || []);
      } catch (err) {
        console.warn("Wallets fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchWallets();
  }, []);

  if (loading) {
    return <div className="h-9 bg-gray-100 rounded-lg animate-pulse w-full" />;
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">
        Wallet / Payment Source
      </label>
      <div className="flex flex-wrap gap-2">
        {/* No wallet option */}
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition
            ${!value
              ? "border-gray-400 bg-gray-100 text-gray-800"
              : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
        >
          <span>🔘</span> Unspecified
        </button>

        {wallets.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => onChange(w.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition
              ${value === w.id
                ? "border-2 text-white font-bold"
                : "border-gray-200 text-gray-700 hover:border-gray-300 bg-white"
              }`}
            style={value === w.id ? { borderColor: w.color, backgroundColor: w.color } : {}}
          >
            <span>{w.icon}</span>
            {w.name}
          </button>
        ))}
      </div>
    </div>
  );
}
