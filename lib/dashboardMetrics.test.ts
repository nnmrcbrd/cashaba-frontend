import test from "node:test";
import assert from "node:assert/strict";
import { dashboardSafeToSpend } from "./dashboardMetrics";

const setup = { totalIncome: 50_000, incomePeriod: "monthly" };
const breakdown = { configuredIncome: 50_000, actualIncome: 0, totalIncome: 0, totalFixed: 6_180, totalSavings: 2_000, totalLoanRepayments: 0, totalExpenses: 0, rawSafeToSpend: -8_180, safeToSpend: 0 };

test("new onboarding displays the remaining income plan without inventing received cash", () => {
  const result = dashboardSafeToSpend(setup, breakdown, 0);
  assert.equal(result.isPlanned, true);
  assert.equal(result.income, 50_000);
  assert.equal(result.safeToSpend, 41_820);
  assert.equal(result.receivedIncome, 0);
  assert.equal(result.recordedSafeToSpend, 0);
  assert.equal(breakdown.totalIncome, 0);
  assert.equal(breakdown.safeToSpend, 0);
});

test("partial received income uses recorded cash instead of the larger expected income", () => {
  const received = { ...breakdown, actualIncome: 10_000, totalIncome: 10_000, rawSafeToSpend: 1_820, safeToSpend: 1_820 };
  const result = dashboardSafeToSpend(setup, received, 1_820);
  assert.equal(result.isPlanned, false);
  assert.equal(result.income, 10_000);
  assert.equal(result.safeToSpend, 1_820);
});

test("recorded shortfalls stay zero even when an income plan is positive", () => {
  const received = { ...breakdown, actualIncome: 1_000, totalIncome: 1_000, rawSafeToSpend: -7_180 };
  const result = dashboardSafeToSpend(setup, received, 0);
  assert.equal(result.isPlanned, false);
  assert.equal(result.safeToSpend, 0);
  assert.equal(result.rawSafeToSpend, -7_180);
});

test("planned shortfalls are clamped and all bill, savings, debt and spending reserves are deducted", () => {
  const result = dashboardSafeToSpend({ totalIncome: 1_000, incomePeriod: "weekly" }, { ...breakdown, totalFixed: 400, totalSavings: 300, totalLoanRepayments: 200, totalExpenses: 250 }, 0);
  assert.equal(result.isPlanned, true);
  assert.equal(result.rawSafeToSpend, -150);
  assert.equal(result.safeToSpend, 0);
});

test("missing setup or an unavailable breakdown cannot produce a fictional income-plan balance", () => {
  assert.equal(dashboardSafeToSpend(null, { ...breakdown, configuredIncome: 0 }, 0).isPlanned, false);
  assert.equal(dashboardSafeToSpend(setup, null, 0).isPlanned, false);
  assert.equal(dashboardSafeToSpend(setup, null, 0).safeToSpend, 0);
});

test("weekly income stays weekly and cents are preserved without summing received and expected income", () => {
  const result = dashboardSafeToSpend({ totalIncome: 2_000.25, incomePeriod: "weekly" }, { ...breakdown, totalFixed: 500.10, totalSavings: 200.05, totalExpenses: 100.01 }, 0);
  assert.equal(result.income, 2_000.25);
  assert.equal(result.safeToSpend, 1_200.09);
});
