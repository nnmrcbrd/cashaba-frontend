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
  accountType: "Standard User" | "Premium";
  status: "Active" | "Inactive";
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "Income" | "Expense";
  amount: number;
}

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