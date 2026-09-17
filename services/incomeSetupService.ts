import apiClient from "@/lib/apiClient";

export interface IncomeSetup {
  id?: string;
  totalIncome: number;
  incomePeriod: "weekly" | "monthly" | string;
  safeToSpend?: number;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  amountPaid: number;
  remaining: number;
  dueDate?: string | null;
  frequency: "ONE_TIME" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  status: "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "COMPLETED";
  category: string;
  reminderDays: number;
  walletId?: string | null;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyAllocation: number;
  isCompleted: boolean;
}

export interface SafeToSpendBreakdown {
  configuredIncome?: number;
  actualIncome?: number;
  totalIncome: number;
  totalFixed: number;
  totalSavings: number;
  totalExpenses: number;
  totalLoanRepayments?: number;
  rawSafeToSpend: number;
  safeToSpend: number;
}

export interface IncomeSetupResponse {
  setup: IncomeSetup | null;
  safeToSpend: number;
  breakdown?: SafeToSpendBreakdown;
}

export const incomeSetupService = {
  async getIncomeSetup(): Promise<IncomeSetupResponse> {
    const res = await apiClient.get("/income-setup");
    return res.data;
  },

  async saveIncomeSetup(totalIncome: number, incomePeriod: "weekly" | "monthly" | string): Promise<{ setup: IncomeSetup; safeToSpend: number }> {
    const res = await apiClient.post("/income-setup", {
      totalIncome,
      incomePeriod,
    });
    return res.data;
  },

  async getFixedExpenses(): Promise<FixedExpense[]> {
    const res = await apiClient.get("/income-setup/fixed-expenses");
    return res.data;
  },

  async addFixedExpense(name: string, amount: number, dueDate?: string, details?: Partial<Pick<FixedExpense, "frequency" | "category" | "reminderDays" | "walletId">>): Promise<{ expense: FixedExpense; safeToSpend: number }> {
    const res = await apiClient.post("/income-setup/fixed-expenses", { name, amount, dueDate: dueDate || null, ...details });
    return res.data;
  },

  async updateFixedExpense(id: string, updates: Partial<Pick<FixedExpense, "name" | "amount" | "dueDate" | "frequency" | "category" | "reminderDays" | "walletId">>): Promise<{ expense: FixedExpense; safeToSpend: number }> {
    const res = await apiClient.patch(`/income-setup/fixed-expenses/${id}`, updates);
    return res.data;
  },

  async deleteFixedExpense(id: string): Promise<{ message: string; safeToSpend: number }> {
    const res = await apiClient.delete(`/income-setup/fixed-expenses/${id}`);
    return res.data;
  },

  async getSavingsGoals(): Promise<SavingsGoal[]> {
    const res = await apiClient.get("/income-setup/savings-goals");
    return res.data;
  },

  async addSavingsGoal(name: string, targetAmount: number, monthlyAllocation: number = 0): Promise<{ goal: SavingsGoal; safeToSpend: number }> {
    const res = await apiClient.post("/income-setup/savings-goals", { name, targetAmount, monthlyAllocation });
    return res.data;
  },

  async updateSavingsGoal(id: string, updates: { addAmount?: number; withdrawAmount?: number; walletId?: string | null; isCompleted?: boolean; monthlyAllocation?: number }): Promise<{ goal: SavingsGoal; safeToSpend: number }> {
    const res = await apiClient.patch(`/income-setup/savings-goals/${id}`, updates);
    return res.data;
  },

  async deleteSavingsGoal(id: string): Promise<{ message: string; safeToSpend: number }> {
    const res = await apiClient.delete(`/income-setup/savings-goals/${id}`);
    return res.data;
  },
};
