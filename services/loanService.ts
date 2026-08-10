import apiClient from "@/lib/apiClient";

export interface Loan {
  id: string;
  title: string;
  amount: number;
  status: "ACTIVE" | "PAID_OFF" | "OVERDUE";
  type: "BORROWED" | "LENT";
  startDate: string;
  deadline: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoanSummary {
  totalBorrowed: number;
  totalLent: number;
  overdueCount: number;
}

export const loanService = {
  async getLoans(): Promise<{ loans: Loan[]; summary: LoanSummary }> {
    const res = await apiClient.get("/loans");
    return {
      loans: res.data.loans || res.data || [],
      summary: res.data.summary || { totalBorrowed: 0, totalLent: 0, overdueCount: 0 },
    };
  },

  async createLoan(data: { title: string; amount: number; type: "BORROWED" | "LENT"; deadline?: string }): Promise<Loan> {
    const res = await apiClient.post("/loans", data);
    return res.data;
  },

  async updateLoanStatus(id: string, status: "ACTIVE" | "PAID_OFF" | "OVERDUE"): Promise<Loan> {
    const res = await apiClient.patch(`/loans/${id}/status`, { status });
    return res.data;
  },

  async deleteLoan(id: string): Promise<void> {
    await apiClient.delete(`/loans/${id}`);
  },
};
