"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import axios from "axios";
import { Camera, FileImage, LoaderCircle, ScanLine } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { CATEGORIES } from "@/constants";
import { transactionService } from "@/services/transactionService";
import WalletSelector from "@/app/components/WalletSelector";

type ReceiptTransactionType = "expense" | "income";

interface ReceiptDraft {
  amount: string;
  description: string;
  date: string;
  category: string;
  type: ReceiptTransactionType;
}

interface ReceiptScannerProps {
  onTransactionCreated: () => void | Promise<void>;
}

const supportedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

function categoriesFor(type: ReceiptTransactionType) {
  return type === "income" ? CATEGORIES.INCOME : CATEGORIES.EXPENSE;
}

export default function ReceiptScanner({ onTransactionCreated }: ReceiptScannerProps) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReceiptDraft | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function resetImage() {
    setPreview(null);
    setDraft(null);
    setWalletId(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function scanImage(base64: string, mimeType: string) {
    setScanning(true);
    try {
      const response = await apiClient.post("/gcash/scan-image", { base64, mimeType });
      const parsed = response.data?.parsed;
      if (!parsed) throw new Error("No transaction details were returned.");

      const type: ReceiptTransactionType = parsed.transactionType === "INCOME" ? "income" : "expense";
      const availableCategories = categoriesFor(type);
      setDraft({
        amount: String(parsed.amount ?? ""),
        description: String(parsed.description ?? ""),
        date: String(parsed.date ?? new Date().toISOString().slice(0, 10)).slice(0, 10),
        category: availableCategories.includes(parsed.category) ? parsed.category : availableCategories.at(-1) || "Others",
        type,
      });
    } catch (scanError) {
      const message = axios.isAxiosError<{ message?: string }>(scanError)
        ? scanError.response?.data?.message
        : null;
      setError(message || "The image could not be read. Try a clearer, well-lit photo or enter the transaction manually.");
    } finally {
      setScanning(false);
    }
  }

  function processFile(file: File) {
    if (!supportedImageTypes.has(file.type)) {
      setError("Choose a PNG, JPG, or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("The image must be 2 MB or smaller.");
      return;
    }

    setError("");
    setDraft(null);
    const reader = new FileReader();
    reader.onerror = () => setError("The selected image could not be opened.");
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const base64 = dataUrl.split(",")[1];
      if (!base64) {
        setError("The selected image could not be opened.");
        return;
      }
      setPreview(dataUrl);
      void scanImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  }

  function changeType(type: ReceiptTransactionType) {
    setDraft((current) => current ? { ...current, type, category: categoriesFor(type)[0] } : current);
  }

  async function saveTransaction() {
    if (!draft || !walletId || !draft.description.trim() || !draft.category || !draft.date || Number(draft.amount) <= 0) return;
    setSaving(true);
    setError("");
    try {
      await transactionService.createTransaction({
        amount: Number(draft.amount),
        description: draft.description.trim(),
        date: draft.date,
        category: draft.category,
        type: draft.type,
        walletId,
      });
      await onTransactionCreated();
      resetImage();
    } catch {
      setError("The transaction could not be saved. Review the details and selected account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {!preview ? (
        <div
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) processFile(file);
          }}
          onClick={() => fileRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${dragging ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/50"}`}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Camera className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-900">Take a photo or upload a receipt</p>
          <p className="mt-1 text-xs text-slate-500">Receipts and payment screenshots · PNG, JPG, or WebP · up to 2 MB</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) processFile(file);
            }}
          />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div>
            <div className="relative h-72 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <Image src={preview} alt="Uploaded receipt preview" fill sizes="(max-width: 768px) 100vw, 40vw" unoptimized className="object-contain" />
            </div>
            <button type="button" onClick={resetImage} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800">
              <FileImage className="h-4 w-4" aria-hidden="true" /> Choose another image
            </button>
          </div>

          <div>
            {scanning ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50/60 text-emerald-800">
                <LoaderCircle className="h-8 w-8 animate-spin" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold">Reading transaction details…</p>
                <p className="mt-1 text-xs text-emerald-700/70">The image is processed temporarily and is not saved.</p>
              </div>
            ) : draft ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                  AI can make mistakes. Review every field before recording the transaction.
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(["expense", "income"] as const).map((type) => (
                    <button key={type} type="button" onClick={() => changeType(type)} className={`rounded-xl py-2.5 text-xs font-bold capitalize ${draft.type === type ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}>
                      {type}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="field-label">Merchant or description</label>
                  <input value={draft.description} maxLength={200} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="field-input" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">Amount</label>
                    <input type="number" min="0.01" step="0.01" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} className="field-input" />
                  </div>
                  <div>
                    <label className="field-label">Date</label>
                    <input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} className="field-input" />
                  </div>
                </div>
                <div>
                  <label className="field-label">Category</label>
                  <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} className="field-input">
                    {categoriesFor(draft.type).map((category) => <option key={category}>{category}</option>)}
                  </select>
                </div>
                <WalletSelector value={walletId} onChange={setWalletId} label={draft.type === "income" ? "Account receiving funds" : "Account charged"} />

                <button type="button" onClick={() => void saveTransaction()} disabled={saving || !walletId || !draft.description.trim() || Number(draft.amount) <= 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
                  {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ScanLine className="h-4 w-4" aria-hidden="true" />}
                  {saving ? "Recording…" : "Review complete — record transaction"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}
    </div>
  );
}
