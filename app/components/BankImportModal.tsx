"use client";

import { useState, useRef } from "react";
import apiClient from "@/lib/apiClient";
import axios from "axios";
import WalletSelector from "@/app/components/WalletSelector";

interface BankImportModalProps {
  onClose: () => void;
  onImportSuccess: (count: number) => void;
}

const BANKS = [
  { id: "gcash", label: "GCash CSV Export" },
  { id: "bdo", label: "BDO Bank Statement" },
  { id: "bpi", label: "BPI Online CSV" },
  { id: "unionbank", label: "UnionBank CSV" },
  { id: "generic", label: "Generic CSV (Any Bank)" },
];

export default function BankImportModal({ onClose, onImportSuccess }: BankImportModalProps) {
  const [bankType, setBankType] = useState("generic");
  const [file, setFile] = useState<File | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImport() {
    if (!file || !walletId) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("CSV file must be 2 MB or smaller.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string"
          ? resolve(reader.result)
          : reject(new Error("Unable to read file"));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const base64 = dataUrl.split(",", 2)[1];

      const res = await apiClient.post("/transactions/import-csv", { csvBase64: base64, bankType, walletId });
      setResult({ imported: res.data.imported, skipped: res.data.skipped });
      onImportSuccess(res.data.imported);
    } catch (err) {
      setError(axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message || "Import failed. Please check your CSV format."
        : "Import failed. Please check your CSV format.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-lg transition"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🏦</span>
          <div>
            <h2 className="text-base font-bold text-gray-900">Import Bank Statement</h2>
            <p className="text-xs text-gray-500">Upload a CSV from your bank to bulk-import transactions.</p>
          </div>
        </div>

        {result ? (
          <div className="text-center py-6">
            <p className="text-4xl mb-3">✅</p>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Import Complete!</h3>
            <p className="text-xs text-gray-600">
              <strong className="text-emerald-700">{result.imported} transactions</strong> imported
              {result.skipped > 0 && `, ${result.skipped} skipped because they could not be saved`}.
            </p>
            <button
              onClick={onClose}
              className="mt-4 bg-[#186849] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition hover:bg-[#13543b]"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Bank Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Bank / Source</label>
              <div className="grid grid-cols-2 gap-2">
                {BANKS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBankType(b.id)}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium text-left transition
                      ${bankType === b.id
                        ? "border-[#186849] bg-emerald-50 text-emerald-800 font-bold"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <WalletSelector value={walletId} onChange={setWalletId} label="Account for imported entries" />
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">CSV File</label>
              <div
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition
                  ${file ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}
              >
                {file ? (
                  <div>
                    <p className="text-sm font-bold text-emerald-700">📄 {file.name}</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {(file.size / 1024).toFixed(1)} KB · Click to change
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-400 text-xs">Click to browse or drag CSV here</p>
                    <p className="text-[11px] text-gray-400 mt-1">.csv files only</p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!file || !walletId || loading}
                className="flex-1 bg-[#186849] hover:bg-[#13543b] disabled:opacity-40 text-white py-2.5 rounded-xl text-xs font-bold transition"
              >
                {loading ? "Importing..." : "🏦 Import Transactions"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
