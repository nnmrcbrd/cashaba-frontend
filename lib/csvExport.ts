/**
 * csvExport.ts
 * Utility to export an array of transactions as a downloadable CSV file.
 * Uses browser downloads on web and the Android share sheet in the APK.
 */
import { saveExportFile } from './nativeFiles';

interface ExportTransaction {
  id?: string;
  date?: string;
  description: string;
  category: string;
  type: string;
  amount: number;
}

export function exportTransactionsCSV(
  transactions: ExportTransaction[],
  filename = "casha-ba-transactions.csv"
): void {
  const headers = ["Date", "Description", "Category", "Type", "Amount (₱)"];

  const rows = transactions.map((t) => {
    const date = t.date ? t.date.split("T")[0] : new Date().toISOString().split("T")[0];
    const type = (t.type || "")
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    const amount = Number(t.amount).toFixed(2);
    // Escape commas and quotes in text fields
    const escape = (val: string) =>
      val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;

    return [date, escape(t.description || ""), escape(t.category || ""), type, amount].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  void saveExportFile(blob, filename).catch(() => alert('The CSV export could not be saved or shared. Please try again.'));
}
