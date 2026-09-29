import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Casha-Ba | Know What Is Safe to Spend",
  description: "Track income, expenses, budgets, savings, obligations, and manual accounts with one clear Safe-to-Spend view.",
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
