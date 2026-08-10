import apiClient from "@/lib/apiClient";
import { Transaction, TransactionType } from "@/app/types";

export const transactionService = {
  async getTransactions(): Promise<Transaction[]> {
    const res = await apiClient.get("/transactions");
    return res.data.map((tx: any) => ({
      id: tx.id,
      date: tx.date ? tx.date.split("T")[0] : new Date().toISOString().split("T")[0],
      description: tx.description || tx.category,
      category: tx.category,
      type: (tx.type || "EXPENSE").toLowerCase() as TransactionType,
      amount: tx.amount,
    }));
  },

  async createTransaction(tx: Omit<Transaction, "id">): Promise<Transaction> {
    const res = await apiClient.post("/transactions", {
      description: tx.description || tx.category,
      type: tx.type.toUpperCase(),
      category: tx.category,
      amount: tx.amount,
      date: tx.date,
    });
    const newTx = res.data;
    return {
      id: newTx.id,
      date: newTx.date ? newTx.date.split("T")[0] : new Date().toISOString().split("T")[0],
      description: newTx.description || newTx.category,
      category: newTx.category,
      type: (newTx.type || "EXPENSE").toLowerCase() as TransactionType,
      amount: newTx.amount,
    };
  },

  async deleteTransaction(id: string): Promise<void> {
    await apiClient.delete(`/transactions/${id}`);
  },
};
