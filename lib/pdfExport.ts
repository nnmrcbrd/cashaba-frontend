import { Transaction } from "@/app/types";

export interface ReportData {
  allowanceLabel?: string;
  userName: string;
  userEmail: string;
  safeToSpend: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactions: Transaction[];
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));
}
function reportMoney(amount: number) {
  return `${amount < 0 ? '−' : ''}₱${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}
export function movementSign(transaction: Pick<Transaction, 'type' | 'category'>) {
  if (['income', 'loan_collection', 'loan_proceeds'].includes(transaction.type)) return '+';
  if (['expense', 'bill_payment', 'debt_payment', 'loan_disbursement'].includes(transaction.type)) return '−';
  if (['savings_contribution', 'savings_withdrawal'].includes(transaction.type)) return '↔';
  if (transaction.type === 'adjustment') return transaction.category === 'Balance Decrease' ? '−' : '+';
  return '↔';
}
export function buildFinancialReportHtml(data: ReportData) {
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const rowsHtml = data.transactions
    .map(
      (t) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 8px; color: #4b5563;">${escapeHtml(t.date)}</td>
      <td style="padding: 8px; font-weight: 600; color: #111827;">${escapeHtml(t.description || t.category)}</td>
      <td style="padding: 8px; color: #4b5563;">${escapeHtml(t.category)}</td>
      <td style="padding: 8px; font-weight: 700; color: ${
        movementSign(t) === "+" ? "#16a34a" : movementSign(t) === "−" ? "#dc2626" : "#2563eb"
      };">
        ${movementSign(t)}₱${t.amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      })}
      </td>
    </tr>
  `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
        <title>CASHA-BA Financial Report - ${escapeHtml(data.userName)}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #16a34a; padding-bottom: 20px; margin-bottom: 30px; }
          .brand { font-size: 24px; font-weight: 800; color: #14532d; }
          .brand span { color: #22c55e; }
          .title { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; font-weight: 600; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 15px; text-align: center; }
          .card-title { font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; }
          .card-value { font-size: 18px; font-weight: 800; margin-top: 5px; color: #111827; }
          .card-value.green { color: #16a34a; }
          .card-value.safe { color: #047857; font-size: 22px; }
          .card-value.red { color: #dc2626; }
          tr { break-inside: avoid; }
          thead { display: table-header-group; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th { background: #f3f4f6; text-align: left; padding: 10px; font-weight: 700; color: #374151; border-bottom: 2px solid #e5e7eb; }
          .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 15px; font-size: 11px; color: #9ca3af; text-align: center; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Casha<span>-Ba</span></div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">AI-Powered Personal Finance System</div>
          </div>
          <div style="text-align: right;">
            <div class="title">Financial Summary Report</div>
            <div style="font-size: 12px; color: #4b5563;">Date: ${dateStr}</div>
            <div style="font-size: 12px; color: #4b5563;">User: ${escapeHtml(data.userName)} (${escapeHtml(data.userEmail)})</div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="card" style="background: #ecfdf5; border-color: #a7f3d0;">
            <div class="card-title" style="color: #047857;">${escapeHtml(data.allowanceLabel || "Safe-to-Spend")}</div>
            <div class="card-value ${data.safeToSpend < 0 ? 'red' : 'safe'}">${reportMoney(data.safeToSpend)}</div>
          </div>
          <div class="card">
            <div class="card-title">Total Income</div>
            <div class="card-value green">${reportMoney(data.totalIncome)}</div>
          </div>
          <div class="card">
            <div class="card-title">Total Expenses</div>
            <div class="card-value red">${reportMoney(data.totalExpense)}</div>
          </div>
          <div class="card">
            <div class="card-title">Net Balance</div>
            <div class="card-value ${data.netBalance < 0 ? 'red' : 'green'}">${reportMoney(data.netBalance)}</div>
          </div>
        </div>

        <h3 style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 10px;">Selected Transaction History (${data.transactions.length} movements)</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="4" style="padding: 15px; text-align: center; color: #9ca3af;">No transactions recorded.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          Generated automatically by Casha-Ba Financial Management System · Savings and wallet transfers are internal movements and are excluded from income, expenses, and net balance.
        </div>


      </body>
    </html>
  `;

  return html;
}

export function exportFinancialReport(data: ReportData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) { alert('Please allow popups to export the report.'); return; }
  printWindow.opener = null;
  printWindow.document.write(buildFinancialReportHtml(data));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
