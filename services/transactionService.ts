import apiClient from "@/lib/apiClient";
import { Transaction, TransactionType } from "@/app/types";

export const transactionService = {
  async getTransactions(): Promise<Transaction[]> {
    const res = await apiClient.get("/transactions");
    return res.data.map((tx: BackendTransaction) => ({
      id: tx.id,
      date: tx.date ? tx.date.split("T")[0] : new Date().toISOString().split("T")[0],
      description: tx.description || tx.category,
      category: tx.category,
      type: (tx.type || "EXPENSE").toLowerCase() as TransactionType,
      amount: tx.amount,
      walletId: tx.walletId,
      wallet: tx.wallet,
      destinationWalletId: tx.destinationWalletId,
      destinationWallet: tx.destinationWallet,
      savingsGoalId: tx.savingsGoalId,
      fixedExpenseId: tx.fixedExpenseId,
    }));
  },

  async createTransaction(tx: Omit<Transaction, "id">): Promise<Transaction> {
    const res = await apiClient.post("/transactions", {
      description: tx.description || tx.category,
      type: tx.type.toUpperCase(),
      category: tx.category,
      amount: tx.amount,
      date: tx.date,
      walletId: tx.walletId || null,
      destinationWalletId: tx.destinationWalletId || null,
      savingsGoalId: tx.savingsGoalId || null,
      fixedExpenseId: tx.fixedExpenseId || null,
    });
    const newTx = res.data;
    return {
      id: newTx.id,
      date: newTx.date ? newTx.date.split("T")[0] : new Date().toISOString().split("T")[0],
      description: newTx.description || newTx.category,
      category: newTx.category,
      type: (newTx.type || "EXPENSE").toLowerCase() as TransactionType,
      amount: newTx.amount,
      walletId: newTx.walletId,
      wallet: newTx.wallet,
      destinationWalletId: newTx.destinationWalletId,
      destinationWallet: newTx.destinationWallet,
      savingsGoalId: newTx.savingsGoalId,
      fixedExpenseId: newTx.fixedExpenseId,
    };
  },

  async deleteTransaction(id: string): Promise<void> {
    await apiClient.delete(`/transactions/${id}`);
  },

  async updateTransaction(id: string, updates: Partial<Pick<Transaction, "description" | "category" | "amount" | "date" | "walletId">>): Promise<void> {
    await apiClient.put(`/transactions/${id}`, updates);
  },

  async undoLastTransaction(): Promise<{ message: string }> {
    const res = await apiClient.post("/transactions/undo");
    return res.data;
  },
};

interface BackendTransaction {
  id: string;
  date?: string;
  description?: string;
  category: string;
  type?: "INCOME" | "EXPENSE";
  amount: number;
  walletId?: string | null;
  wallet?: {
    id: string;
    name: string;
    color: string;
  } | null;
  destinationWalletId?: string | null;
  destinationWallet?: { id: string; name: string; color: string } | null;
  savingsGoalId?: string | null;
  fixedExpenseId?: string | null;
}
