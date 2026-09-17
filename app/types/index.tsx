export interface User {
  id: string;
  name: string;
  email: string;
  gender?: string;
  address?: string;
  phone?: string;
  role: ("Student" | "Working" | "Freelance" | "Married")[];
  avatar?: string;
  memberSince: string;
  accountRole?: "USER" | "ADMIN" | string;
  status: "Active" | "Inactive";
  onboardingComplete?: boolean;
  onboardingStep?: number;
  customRole?: string;
  region?: string;
  accountStatus?: "ACTIVE" | "SUSPENDED";
  lastActiveAt?: string;
  authMethod?: "LOCAL" | "GOOGLE";
}

export type TransactionType = "income" | "expense" | "transfer" | "adjustment" | "savings_contribution" | "savings_withdrawal" | "bill_payment" | "debt_payment" | "loan_collection";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
  walletId?: string | null;
  wallet?: Pick<Wallet, "id" | "name" | "color"> | null;
  destinationWalletId?: string | null;
  destinationWallet?: Pick<Wallet, "id" | "name" | "color"> | null;
  savingsGoalId?: string | null;
  fixedExpenseId?: string | null;
}

export type AccountType = "CASH" | "BANK" | "EWALLET" | "CREDIT_CARD" | "INVESTMENT" | "OTHER";
export type AccountKind = "ASSET" | "LIABILITY";

export interface Wallet {
  id: string;
  name: string;
  institution?: string | null;
  accountType: AccountType;
  kind: AccountKind;
  openingBalance: number;
  balance: number;
  icon: "wallet" | "bank" | "phone" | "card" | "chart" | "other";
  color: string;
  createdAt: string;
  updatedAt?: string;
}

export type WalletInput = Omit<Wallet, "id" | "balance" | "createdAt">;

export type IncomeCategory = "Salary" | "Allowance" | "Business" | "Freelance" | "Others";
export type ExpenseCategory = "Food" | "Transport" | "Bills" | "Shopping" | "Entertainment" | "Health" | "Others";

export interface Budget {
  category: string;
  icon: string;
  amount: number;
  spent: number;
  frequency: "Monthly" | "Weekly";
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  icon: string;
}

export interface Income {
  source: string;
  amount: number;
  frequency: "Monthly" | "Weekly";
  scheduleDay: string;
}

export interface AnalyticsData {
  category: string;
  percentage: number;
  amount: number;
  color: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
