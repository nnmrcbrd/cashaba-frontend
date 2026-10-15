import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import DashboardSetupSummary from "../app/components/DashboardSetupSummary";

const savedSetup = {
  incomeSetup: { totalIncome: 50_000, incomePeriod: "monthly" },
  receivedIncome: 0,
  budget: { configured: true, targetAmount: 10_000 },
  fixedExpenses: [
    { id: "rent", name: "House rent", amount: 3_000, amountPaid: 0, remaining: 3_000, frequency: "MONTHLY" as const, status: "PENDING" as const, category: "Bills", reminderDays: 3 },
    { id: "internet", name: "Internet", amount: 980, amountPaid: 0, remaining: 980, frequency: "MONTHLY" as const, status: "PENDING" as const, category: "Bills", reminderDays: 3 },
  ],
  savingsGoals: [{ id: "laptop", name: "Laptop", targetAmount: 35_000, currentAmount: 0, monthlyAllocation: 2_000, isCompleted: false }],
};

test("saved onboarding targets remain visible before any income or savings contribution is recorded", () => {
  const html = renderToStaticMarkup(createElement(DashboardSetupSummary, savedSetup));
  for (const value of ["Your saved setup", "₱50,000.00", "₱10,000.00", "House rent", "Internet", "₱3,000.00", "₱980.00", "Laptop", "₱35,000.00", "₱2,000.00"]) {
    assert.ok(html.includes(value), `Saved value should be displayed: ${value}`);
  }
  assert.match(html, /Received this .*month.*₱0\.00/);
  assert.match(html, /Saved: .*₱0\.00/);
  assert.ok(html.includes("No income has been recorded as received"));
  assert.ok(html.includes('href="/transactions"'));
});

test("received money is shown independently of expected income after a transaction is recorded", () => {
  const html = renderToStaticMarkup(createElement(DashboardSetupSummary, { ...savedSetup, receivedIncome: 12_000 }));
  assert.ok(html.includes("₱50,000.00"));
  assert.match(html, /Received this .*month.*₱12,000\.00/);
  assert.ok(!html.includes("No income has been recorded as received"));
});

test("weekly plans keep their original amount and genuinely empty setup is identified explicitly", () => {
  const weekly = renderToStaticMarkup(createElement(DashboardSetupSummary, { ...savedSetup, incomeSetup: { totalIncome: 5_000, incomePeriod: "weekly" } }));
  assert.match(weekly, /Expected income per .*week/);
  assert.ok(weekly.includes("₱5,000.00"));
  const empty = renderToStaticMarkup(createElement(DashboardSetupSummary, { incomeSetup: null, receivedIncome: 0, budget: { configured: false, targetAmount: 0 }, fixedExpenses: [], savingsGoals: [] }));
  assert.equal((empty.match(/Not set/g) || []).length, 2);
  assert.ok(empty.includes("No bills saved."));
  assert.ok(empty.includes("No savings goals saved."));
  assert.ok(!empty.includes("Your expected income is saved."));
});
