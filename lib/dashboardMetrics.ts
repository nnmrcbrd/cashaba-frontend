import type { IncomeSetup, SafeToSpendBreakdown } from "../services/incomeSetupService";

export function dashboardSafeToSpend(setup: IncomeSetup | null, breakdown: SafeToSpendBreakdown | null, recordedSafeToSpend: number) {
  const receivedIncome = breakdown?.actualIncome ?? breakdown?.totalIncome ?? 0;
  const plannedIncome = setup?.totalIncome ?? breakdown?.configuredIncome ?? 0;
  const isPlanned = Boolean(breakdown && plannedIncome > 0 && receivedIncome === 0);
  const income = isPlanned ? plannedIncome : breakdown?.totalIncome ?? receivedIncome;
  const cents = (amount: number) => Math.round(amount * 100);
  const rawSafeToSpend = isPlanned && breakdown
    ? (cents(income) - cents(breakdown.totalFixed) - cents(breakdown.totalSavings) - cents(breakdown.totalLoanRepayments ?? 0) - cents(breakdown.totalExpenses)) / 100
    : breakdown?.rawSafeToSpend ?? recordedSafeToSpend;
  return {
    isPlanned,
    income,
    receivedIncome,
    rawSafeToSpend,
    safeToSpend: isPlanned ? Math.max(0, rawSafeToSpend) : recordedSafeToSpend,
    recordedSafeToSpend,
  };
}
