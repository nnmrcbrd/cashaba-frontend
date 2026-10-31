"use client";
import { ValidatedForm, ValidatedInput, ValidatedSelect } from "@/app/components/ui/ValidatedForm";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/ui/sidebar";
import WalletSelector from "@/app/components/WalletSelector";
import { incomeSetupService, type FixedExpense } from "@/services/incomeSetupService";
import { loanService, type Loan, type LoanSummary } from "@/services/loanService";
import { transactionService } from "@/services/transactionService";
import axios from "axios";

const emptySummary: LoanSummary = { totalBorrowed: 0, totalLent: 0, overdueCount: 0, scheduledDue: 0 };
const BILLS_PER_PAGE = 6;
type Modal = "bill" | "debt" | null;

export default function ObligationsPage() {
  const [tab, setTab] = useState<"bills" | "debts">("bills");
  const [bills, setBills] = useState<FixedExpense[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoanSummary>(emptySummary);
  const [modal, setModal] = useState<Modal>(null);
  const [payingBill, setPayingBill] = useState<FixedExpense | null>(null);
  const [editingBill, setEditingBill] = useState<FixedExpense | null>(null);
  const [payingLoan, setPayingLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [billPage, setBillPage] = useState(1);

  async function load() {
    setLoading(true);
    try {
      const [obligations, debtData] = await Promise.all([incomeSetupService.getFixedExpenses(), loanService.getLoans()]);
      setBills(obligations); setLoans(debtData.loans); setSummary(debtData.summary);
    } finally { setLoading(false); }
  }
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (new URLSearchParams(window.location.search).get("tab") === "debts") setTab("debts");
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const upcoming = bills.filter((bill) => ["PENDING", "PARTIALLY_PAID", "OVERDUE"].includes(bill.status));
  const outstandingBills = upcoming.reduce((sum, bill) => sum + bill.remaining, 0);
  const billPageCount = Math.max(1, Math.ceil(bills.length / BILLS_PER_PAGE));
  const currentBillPage = Math.min(billPage, billPageCount);
  const visibleBills = bills.slice((currentBillPage - 1) * BILLS_PER_PAGE, currentBillPage * BILLS_PER_PAGE);

  return <div className="flex min-h-screen bg-[#f7f9f8]"><Sidebar /><main className="app-main">
    <header className="app-page-header mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4"><div><h1>Obligations & Debts</h1><p className="mt-1 text-xs text-gray-500">One place for bills, subscriptions, installments, borrowed money, and money lent.</p></div><button onClick={() => setModal(tab === "bills" ? "bill" : "debt")} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white">+ Add {tab === "bills" ? "obligation" : "debt"}</button></header>
    {message && <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">{message}</p>}
    <div className="mb-6 flex gap-2">{(["bills", "debts"] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-full px-5 py-2 text-xs font-bold capitalize ${tab === item ? "bg-emerald-700 text-white" : "border border-gray-200 bg-white text-gray-600"}`}>{item === "bills" ? "Bills & recurring obligations" : "Borrowed & lent money"}</button>)}</div>
    {tab === "bills" ? <>
      <section className="mb-5 grid gap-4 sm:grid-cols-3"><Metric label="Outstanding" value={outstandingBills} /><Metric label="Due or pending" value={upcoming.length} count /><Metric label="Overdue" value={bills.filter((bill) => bill.status === "OVERDUE").length} count danger /></section>
      {loading ? <Loading /> : <>
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleBills.map((bill) => <article key={bill.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${bill.status === "OVERDUE" ? "border-red-200" : "border-gray-200"}`}><div className="flex justify-between gap-4"><div><p className="text-[10px] font-bold uppercase text-gray-400">{bill.category} · {bill.frequency.toLowerCase()}</p><h2 className="mt-1 text-base font-bold text-gray-900">{bill.name}</h2><p className="mt-1 text-xs text-gray-500">{bill.dueDate ? `Due ${new Date(bill.dueDate).toLocaleDateString("en-PH")}` : "No due date"}</p></div><Status status={bill.status} /></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full bg-emerald-600" style={{ width: `${Math.min(100, bill.amount > 0 ? (bill.amountPaid / bill.amount) * 100 : 0)}%` }} /></div><div className="mt-3 flex justify-between text-xs"><span>Paid ₱{bill.amountPaid.toLocaleString()}</span><strong>Remaining ₱{bill.remaining.toLocaleString()}</strong></div><div className="mt-4 flex flex-wrap gap-2">{bill.remaining > 0 && <button onClick={() => setPayingBill(bill)} className="flex-1 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Record payment</button>}<button onClick={() => setEditingBill(bill)} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-emerald-700">Edit bill amount</button><button onClick={async () => { if (confirm(`Delete ${bill.name}?`)) { await incomeSetupService.deleteFixedExpense(bill.id); await load(); } }} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Delete</button></div></article>)}
          {bills.length === 0 && <Empty text="No obligations yet. Add rent, utilities, tuition, or subscriptions." />}
        </div>
        {bills.length > BILLS_PER_PAGE && <Pagination page={currentBillPage} pages={billPageCount} total={bills.length} pageSize={BILLS_PER_PAGE} onChange={setBillPage} />}
      </>}
    </> : <>
      <section className="mb-5 grid gap-4 sm:grid-cols-3"><Metric label="Borrowed outstanding" value={summary.totalBorrowed} /><Metric label="Lent outstanding" value={summary.totalLent} /><Metric label="Overdue" value={summary.overdueCount} count danger /></section>
      {loading ? <Loading /> : <div className="grid gap-4 lg:grid-cols-2">{loans.map((loan) => { const remaining = Math.max(0, loan.amount - loan.amountPaid); return <article key={loan.id} className="rounded-2xl border border-gray-200 bg-white p-5"><div className="flex justify-between"><div><p className="text-[10px] font-bold uppercase text-gray-400">{loan.type === "BORROWED" ? "You borrowed" : "You lent"}</p><h2 className="mt-1 text-base font-bold">{loan.title}</h2><p className="mt-1 text-xs text-gray-500">Due {new Date(loan.deadline).toLocaleDateString("en-PH")} · {loan.repaymentFrequency.toLowerCase()}</p></div><Status status={loan.status} /></div><div className="mt-4 flex justify-between text-xs"><span>Paid ₱{loan.amountPaid.toLocaleString()}</span><strong>Remaining ₱{remaining.toLocaleString()}</strong></div><div className="mt-4 flex gap-2">{remaining > 0 && <button onClick={() => setPayingLoan(loan)} className="flex-1 rounded-xl bg-emerald-700 py-2 text-xs font-bold text-white">{loan.type === "BORROWED" ? "Record payment" : "Record collection"}</button>}<button onClick={async () => { if (confirm(`Delete ${loan.title}?`)) { await loanService.deleteLoan(loan.id); await load(); } }} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Delete</button></div></article>; })}{loans.length === 0 && <Empty text="No borrowed or lent money has been recorded." />}</div>}
    </>}
  </main>
  {modal === "bill" && <BillModal onClose={() => setModal(null)} onSaved={async () => { setModal(null); setMessage("Obligation created."); await load(); }} />}
  {modal === "debt" && <DebtModal onClose={() => setModal(null)} onSaved={async () => { setModal(null); setMessage("Debt recorded."); await load(); }} />}
  {editingBill && <BillAmountModal bill={editingBill} onClose={() => setEditingBill(null)} onSaved={async () => { setEditingBill(null); setMessage("Bill amount updated."); await load(); }} />}
  {payingBill && <PaymentModal title={payingBill.name} remaining={payingBill.remaining} billAmountPaid={payingBill.amountPaid} action="Pay bill" onEditBill={() => { setEditingBill(payingBill); setPayingBill(null); }} onClose={() => setPayingBill(null)} onSave={async (amount, date, walletId) => { await transactionService.createTransaction({ type: "bill_payment", description: `Bill payment: ${payingBill.name}`, category: payingBill.category, amount, date, walletId, fixedExpenseId: payingBill.id }); setPayingBill(null); setMessage("Bill payment recorded."); await load(); }} />}
  {payingLoan && <PaymentModal title={payingLoan.title} remaining={Math.max(0, payingLoan.amount - payingLoan.amountPaid)} action={payingLoan.type === "BORROWED" ? "Pay debt" : "Collect loan"} onClose={() => setPayingLoan(null)} onSave={async (amount, date, walletId) => { await loanService.recordRepayment(payingLoan.id, { amount, date, walletId }); setPayingLoan(null); setMessage("Debt movement recorded."); await load(); }} />}
  </div>;
}

function Metric({ label, value, count, danger }: { label: string; value: number; count?: boolean; danger?: boolean }) { return <div className="rounded-2xl border border-gray-200 bg-white p-5"><p className="text-xs text-gray-500">{label}</p><p className={`mt-1 text-2xl font-extrabold ${danger ? "text-red-600" : "text-emerald-700"}`}>{count ? value : `₱${value.toLocaleString()}`}</p></div>; }
function Loading() { return <p className="py-12 text-center text-xs text-gray-400">Loading obligations…</p>; }
function Empty({ text }: { text: string }) { return <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-xs text-gray-500">{text}</div>; }
function Pagination({ page, pages, total, pageSize, onChange }: { page: number; pages: number; total: number; pageSize: number; onChange: (page: number) => void }) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return <nav aria-label="Recurring bills pages" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs"><span className="text-gray-500">Showing {start}–{end} of {total}</span><div className="flex items-center gap-1"><button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} className="rounded-lg border border-gray-200 px-3 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-40">Previous</button>{Array.from({ length: pages }, (_, index) => index + 1).map((number) => <button key={number} type="button" aria-current={number === page ? "page" : undefined} onClick={() => onChange(number)} className={`h-8 min-w-8 rounded-lg px-2 font-bold ${number === page ? "bg-emerald-700 text-white" : "hover:bg-gray-100"}`}>{number}</button>)}<button type="button" disabled={page === pages} onClick={() => onChange(page + 1)} className="rounded-lg border border-gray-200 px-3 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></nav>;
}
function Status({ status }: { status: string }) { const tone = status === "OVERDUE" ? "bg-red-100 text-red-700" : ["PAID_OFF", "PAID", "COMPLETED"].includes(status) ? "bg-emerald-100 text-emerald-700" : status === "PARTIALLY_PAID" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"; return <span className={`h-fit rounded-full px-2.5 py-1 text-[9px] font-bold ${tone}`}>{status.replaceAll("_", " ")}</span>; }

function BillModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(""); const [amount, setAmount] = useState(""); const [dueDate, setDueDate] = useState(""); const [frequency, setFrequency] = useState<FixedExpense["frequency"]>("MONTHLY"); const [category, setCategory] = useState("Bills");
  return <Modal title="Add obligation" onClose={onClose}><ValidatedForm onSubmit={async (event) => { event.preventDefault(); await incomeSetupService.addFixedExpense(name, Number(amount), dueDate, { frequency, category }); await onSaved(); }}><Field label="Name"><ValidatedInput value={name} onChange={(event) => setName(event.target.value)} required className="modal-input" /></Field><div className="grid grid-cols-2 gap-3"><Field label="Amount"><ValidatedInput type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required className="modal-input" /></Field><Field label="Due date"><ValidatedInput type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required className="modal-input" /></Field></div><div className="grid grid-cols-2 gap-3"><Field label="Frequency"><ValidatedSelect value={frequency} onChange={(event) => setFrequency(event.target.value as FixedExpense["frequency"])} className="modal-input"><option>ONE_TIME</option><option>WEEKLY</option><option>MONTHLY</option><option>QUARTERLY</option><option>YEARLY</option></ValidatedSelect></Field><Field label="Category"><ValidatedInput value={category} onChange={(event) => setCategory(event.target.value)} required className="modal-input" /></Field></div><SubmitButtons onClose={onClose} label="Create obligation" /></ValidatedForm></Modal>;
}
function DebtModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => Promise<void> }) {
  const [title, setTitle] = useState(""); const [amount, setAmount] = useState(""); const [repayment, setRepayment] = useState(""); const [deadline, setDeadline] = useState(""); const [type, setType] = useState<"BORROWED" | "LENT">("BORROWED"); const [frequency, setFrequency] = useState<"ONE_TIME" | "WEEKLY" | "MONTHLY">("MONTHLY");
  const [walletId, setWalletId] = useState<string | null>(null);
  const [alreadyIncluded, setAlreadyIncluded] = useState(false);
  const isOneTime = frequency === "ONE_TIME";
  return <Modal title="Record borrowed or lent money" onClose={onClose}>
    <ValidatedForm onSubmit={async (event) => {
      event.preventDefault();
      if (!walletId && !alreadyIncluded) return;
      await loanService.createLoan({
        title,
        amount: Number(amount),
        type,
        deadline,
        repaymentAmount: Number(isOneTime ? amount : repayment),
        repaymentFrequency: frequency,
        walletId,
        principalAlreadyIncluded: alreadyIncluded,
      });
      await onSaved();
    }}>
      <Field label="Title or person">
        <ValidatedInput value={title} onChange={(event) => setTitle(event.target.value)} required className="modal-input" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Direction">
          <ValidatedSelect value={type} onChange={(event) => setType(event.target.value as typeof type)} className="modal-input">
            <option value="BORROWED">I borrowed</option>
            <option value="LENT">I lent</option>
          </ValidatedSelect>
        </Field>
        <Field label="Total amount">
          <ValidatedInput type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required className="modal-input" />
        </Field>
      </div>
      <div className={isOneTime ? "grid gap-3" : "grid grid-cols-2 gap-3"}>
        <Field label="Frequency">
          <ValidatedSelect value={frequency} onChange={(event) => setFrequency(event.target.value as typeof frequency)} className="modal-input">
            <option value="ONE_TIME">One time</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </ValidatedSelect>
        </Field>
        {!isOneTime && <Field label="Amount per payment">
          <ValidatedInput type="number" min="0.01" step="0.01" value={repayment} onChange={(event) => setRepayment(event.target.value)} required className="modal-input" />
        </Field>}
      </div>
      <Field label={isOneTime ? "Payment due date" : "Next due date"}>
        <ValidatedInput type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} required className="modal-input" />
      </Field>
      <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
        <input type="checkbox" checked={alreadyIncluded} onChange={(event) => setAlreadyIncluded(event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-700" />
        <span><strong className="block text-slate-900">Already included in my current account balance</strong><span className="mt-1 block leading-5">Use this for an existing {type === "BORROWED" ? "debt" : "amount lent"}. Casha-Ba will record what is owed without changing a wallet again.</span></span>
      </label>
      {!alreadyIncluded && <WalletSelector value={walletId} onChange={setWalletId} kind="ASSET" label={type === "BORROWED" ? "Account that received the money" : "Account the money came from"} />}
      <SubmitButtons onClose={onClose} label="Record debt" />
    </ValidatedForm>
  </Modal>;
}
function BillAmountModal({ bill, onClose, onSaved }: { bill: FixedExpense; onClose: () => void; onSaved: () => Promise<void> }) {
  const [amount, setAmount] = useState(String(bill.amount));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  return <Modal title={`Edit bill amount: ${bill.name}`} onClose={onClose}>
    <ValidatedForm onSubmit={async (event) => {
      event.preventDefault();
      setError("");
      setSaving(true);
      try {
        await incomeSetupService.updateFixedExpense(bill.id, { amount: Number(amount) });
        await onSaved();
      } catch (error) {
        setError(axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || "Could not update the bill. Please try again." : "Could not update the bill. Please try again.");
      } finally { setSaving(false); }
    }}>
      <p className="mb-4 text-xs leading-5 text-gray-500">The onboarding amount is an estimate. Enter the actual bill amount, whether it is higher or lower. This updates the current bill and the estimate for future bills.</p>
      <Field label="Bill amount"><ValidatedInput type="number" min={Math.max(0.01, bill.amountPaid)} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required className="modal-input [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" /></Field>
      <div className="mt-3 space-y-1 text-xs text-gray-500"><p>Already paid: ₱{bill.amountPaid.toLocaleString()}</p><p>Remaining after update: <strong className="text-emerald-700">₱{Math.max(0, Number(amount) - bill.amountPaid).toLocaleString()}</strong></p></div>
      {error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}
      <div className="mt-5 flex gap-3"><button type="button" onClick={onClose} disabled={saving} className="flex-1 rounded-xl border py-2.5 text-xs font-bold">Cancel</button><button type="submit" disabled={saving} className="flex-1 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? "Saving…" : "Save bill amount"}</button></div>
    </ValidatedForm>
  </Modal>;
}
function PaymentModal({ title, remaining, billAmountPaid, action, onClose, onSave, onEditBill }: { title: string; remaining: number; billAmountPaid?: number; action: string; onClose: () => void; onSave: (amount: number, date: string, walletId: string) => Promise<void>; onEditBill?: () => void }) {
  const [amount, setAmount] = useState(String(remaining)); const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); const [walletId, setWalletId] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  return <Modal title={`${action}: ${title}`} onClose={onClose}><ValidatedForm onSubmit={async (event) => { event.preventDefault(); if (!walletId || saving) return; setError(""); setSaving(true); try { await onSave(Number(amount), date, walletId); } catch (error) { setError(axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || "Could not record the payment. Please try again." : "Could not record the payment. Please try again."); } finally { setSaving(false); } }}><p className="mb-4 text-xs text-gray-500">Remaining ₱{remaining.toLocaleString()}</p>{onEditBill && <p className="mb-4 text-xs leading-5 text-gray-500">If your payment is higher than the remaining amount, this bill’s total will update automatically when you pay. You can also <button type="button" onClick={onEditBill} disabled={saving} className="font-bold text-emerald-700 underline">Edit bill amount</button> separately.</p>}<Field label="Amount"><ValidatedInput type="number" min="0.01" max={billAmountPaid === undefined ? remaining : undefined} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required className={onEditBill ? "modal-input [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" : "modal-input"} /></Field>{billAmountPaid !== undefined && Number(amount) > remaining && <p className="mb-3 text-xs leading-5 text-emerald-700">New bill total: <strong>₱{((Math.round(billAmountPaid * 100) + Math.round(Number(amount) * 100)) / 100).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> (already paid plus this payment).</p>}<Field label="Date"><ValidatedInput type="date" value={date} onChange={(event) => setDate(event.target.value)} required className="modal-input" /></Field><WalletSelector value={walletId} onChange={setWalletId} />{error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}<div className="mt-5 flex gap-3"><button type="button" onClick={onClose} disabled={saving} className="flex-1 rounded-xl border py-2.5 font-bold">Cancel</button><button type="submit" disabled={!walletId || saving} className="flex-1 rounded-xl bg-emerald-700 py-2.5 font-bold text-white disabled:opacity-50">{saving ? "Saving…" : action}</button></div></ValidatedForm></Modal>;
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 p-4"><section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="mb-5 flex justify-between"><h2 className="text-lg font-bold">{title}</h2><button onClick={onClose} className="text-gray-400">✕</button></div>{children}</section></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="mb-3 block text-xs font-semibold text-gray-700">{label}{children}</label>; }
function SubmitButtons({ onClose, label }: { onClose: () => void; label: string }) { return <div className="mt-5 flex gap-3"><button type="button" onClick={onClose} className="flex-1 rounded-xl border py-2.5 text-xs font-bold">Cancel</button><button type="submit" className="flex-1 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white">{label}</button></div>; }
