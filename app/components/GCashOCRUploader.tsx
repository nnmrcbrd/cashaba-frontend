"use client";

import { useState, useRef } from "react";
import apiClient from "@/lib/apiClient";
import Image from "next/image";
import WalletSelector from "@/app/components/WalletSelector";
import { ValidatedForm, ValidatedInput, ValidatedSelect } from '@/app/components/ui/ValidatedForm';

interface ParsedTransaction {
  amount: number;
  description: string;
  date: string | null;
  transactionType: 'EXPENSE' | 'INCOME' | null;
  category?: string;
}

interface GCashOCRUploaderProps {
  onLogSuccess?: () => void;
}

export default function GCashOCRUploader({ onLogSuccess }: GCashOCRUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [walletId, setWalletId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function processFile(file: File) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Please upload an image file (PNG, JPG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be 2 MB or smaller.");
      return;
    }
    setError(null);
    setParsed(null);
    setSuccess(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      setPreview(e.target?.result as string);
      scanImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  }

  async function scanImage(base64: string, mimeType: string) {
    setLoading(true);
    try {
      const res = await apiClient.post("/gcash/scan-image", { base64, mimeType });
      if (res.data?.parsed) {
        setParsed(res.data.parsed);
      } else {
        setError("Could not extract transaction details. Try a clearer screenshot.");
      }
    } catch {
      setError("Scan failed. Please try again or log manually.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmLog() {
    if (!parsed || !walletId || !parsed.date || !parsed.transactionType) return;
    setLogging(true);
    try {
      await apiClient.post("/transactions", {
        description: parsed.description,
        type: parsed.transactionType,
        category: parsed.category || (parsed.transactionType === 'INCOME' ? 'Other Income' : 'Others'),
        amount: parsed.amount,
        date: parsed.date,
        walletId,
      });
      setSuccess(true);
      setParsed(null);
      setPreview(null);
      onLogSuccess?.();
    } catch {
      setError("Failed to log transaction. Please try again.");
    } finally {
      setLogging(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📸</span>
        <h3 className="text-sm font-bold text-gray-900">GCash Screenshot Auto-Log</h3>
        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
          AI OCR
        </span>
      </div>

      <p className="mb-4 text-xs text-gray-600">Scanning sends the image to Google Gemini. Crop account numbers and unrelated personal details first, or enter the transaction manually. Casha-Ba does not save the image; provider processing follows its service terms.</p>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-3 rounded-xl mb-4">
          ✅ Transaction logged successfully!
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {/* Drop Zone */}
      {!preview && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
            ${dragging
              ? "border-blue-400 bg-blue-50"
              : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
            }`}
        >
          <p className="text-2xl mb-2">📱</p>
          <p className="text-xs font-bold text-gray-700">Drop your GCash screenshot here</p>
          <p className="text-[11px] text-gray-400 mt-1">or click to browse · PNG, JPG supported</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Preview + Parsed Result */}
      {preview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Image Preview */}
          <div>
            <div className="relative h-64 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              <Image src={preview} alt="GCash screenshot" fill unoptimized className="object-contain" />
            </div>
            <button
              onClick={() => { setPreview(null); setParsed(null); setError(null); }}
              className="mt-2 text-[11px] text-gray-400 hover:text-gray-600 transition"
            >
              ✕ Remove image
            </button>
          </div>

          {/* Parsed Info */}
          <div className="flex flex-col justify-between">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">AI scanning screenshot...</p>
              </div>
            ) : parsed ? (
              <ValidatedForm onSubmit={event => { event.preventDefault(); void confirmLog(); }} className="space-y-3">
                <p className="text-xs text-amber-800">Review every field. Select a date and direction if they could not be extracted.</p>
                <label className="block text-xs">Direction
                  <ValidatedSelect aria-label="GCash direction" required value={parsed.transactionType || ''} onChange={event => setParsed({ ...parsed, transactionType: event.target.value as 'EXPENSE' | 'INCOME' })} className="field-input">
                    <option value="" disabled>Choose income or expense</option><option value="EXPENSE">Expense</option><option value="INCOME">Income</option>
                  </ValidatedSelect>
                </label>
                <label className="block text-xs">Date<ValidatedInput aria-label="GCash date" required type="date" value={parsed.date || ''} onChange={event => setParsed({ ...parsed, date: event.target.value })} className="field-input" /></label>
                <label className="block text-xs">Description<ValidatedInput aria-label="GCash description" required value={parsed.description} maxLength={200} onChange={event => setParsed({ ...parsed, description: event.target.value })} className="field-input" /></label>
                <label className="block text-xs">Amount (₱)<ValidatedInput aria-label="GCash amount" required type="number" min="0.01" max="999999999999.99" step="0.01" value={parsed.amount} onChange={event => setParsed({ ...parsed, amount: Number(event.target.value) })} className="field-input" /></label>
                <WalletSelector value={walletId} onChange={setWalletId} label={parsed.transactionType === 'INCOME' ? 'Account receiving funds' : 'Account charged'} />
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Detected Transaction</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount</span>
                      <span className="font-extrabold text-gray-900">₱{parsed.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Description</span>
                      <span className="font-bold text-gray-800 text-right max-w-[140px] truncate">{parsed.description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Category</span>
                      <span className="font-bold text-gray-800">{parsed.category || "Others"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date</span>
                      <span className="font-bold text-gray-800">{parsed.date}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={logging}
                  className="w-full bg-[#186849] hover:bg-[#13543b] disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition"
                >
                  {logging ? "Logging..." : "✅ Confirm & Log Transaction"}
                </button>
              </ValidatedForm>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
