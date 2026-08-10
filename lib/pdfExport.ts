import { Transaction } from "@/app/types";

interface ReportData {
  userName: string;
  userEmail: string;
  safeToSpend: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactions: Transaction[];
}

export function exportFinancialReport(data: ReportData) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to export PDF report.");
    return;
  }

  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const rowsHtml = data.transactions
    .slice(0, 50)
    .map(
      (t) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 8px; color: #4b5563;">${t.date}</td>
      <td style="padding: 8px; font-weight: 600; color: #111827;">${t.description || t.category}</td>
      <td style="padding: 8px; color: #4b5563;">${t.category}</td>
      <td style="padding: 8px; font-weight: 700; color: ${
        t.type === "income" ? "#16a34a" : "#dc2626"
      };">
        ${t.type === "income" ? "+" : "-"}₱${t.amount.toLocaleString("en-US", {
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
      <head>
        <title>CASHA-BA Financial Report - ${data.userName}</title>
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
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th { background: #f3f4f6; text-align: left; padding: 10px; font-weight: 700; color: #374151; border-bottom: 2px solid #e5e7eb; }
          .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; pt-15px; font-size: 11px; color: #9ca3af; text-align: center; }
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
            <div style="font-size: 12px; color: #4b5563;">User: ${data.userName} (${data.userEmail})</div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="card" style="background: #ecfdf5; border-color: #a7f3d0;">
            <div class="card-title" style="color: #047857;">Safe-to-Spend</div>
            <div class="card-value safe">₱${data.safeToSpend.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="card">
            <div class="card-title">Total Income</div>
            <div class="card-value green">₱${data.totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="card">
            <div class="card-title">Total Expenses</div>
            <div class="card-value red">₱${data.totalExpense.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="card">
            <div class="card-title">Net Balance</div>
            <div class="card-value green">₱${data.netBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <h3 style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 10px;">Recent Transaction History</h3>
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
          Generated automatically by Casha-Ba Financial Management System · Confirmed & Verified
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
