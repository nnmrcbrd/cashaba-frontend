/**
 * csvExport.ts
 * Utility to export an array of transactions as a downloadable CSV file.
 * No external dependencies — pure browser API.
 */

interface ExportTransaction {
  id?: string;
  date?: string;
  description: string;
  category: string;
  type: "income" | "expense" | "INCOME" | "EXPENSE";
  amount: number;
}

export function exportTransactionsCSV(
  transactions: ExportTransaction[],
  filename = "casha-ba-transactions.csv"
): void {
  const headers = ["Date", "Description", "Category", "Type", "Amount (₱)"];

  const rows = transactions.map((t) => {
    const date = t.date ? t.date.split("T")[0] : new Date().toISOString().split("T")[0];
    const type = (t.type || "").toUpperCase() === "INCOME" ? "Income" : "Expense";
    const amount = Number(t.amount).toFixed(2);
    // Escape commas and quotes in text fields
    const escape = (val: string) =>
      val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;

    return [date, escape(t.description || ""), escape(t.category || ""), type, amount].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
