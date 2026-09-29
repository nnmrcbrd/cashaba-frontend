export type SafeToSpendScenarioKind = 'income' | 'expense' | 'savings' | 'obligation' | 'loan-payment';

export const safeToSpendScenarioOptions: Array<{
  value: SafeToSpendScenarioKind;
  label: string;
  description: string;
}> = [
  { value: 'expense', label: 'Possible expense', description: 'A purchase or discretionary expense you are considering.' },
  { value: 'income', label: 'Additional income', description: 'Extra salary, freelance income, allowance, or other money received.' },
  { value: 'savings', label: 'Additional savings', description: 'Money you want to reserve for a savings goal.' },
  { value: 'obligation', label: 'New obligation', description: 'A bill or recurring commitment you may add.' },
  { value: 'loan-payment', label: 'Additional loan payment', description: 'An extra repayment toward borrowed money.' },
];

export interface SafeToSpendScenarioResult {
  impact: number;
  projectedRawSafeToSpend: number;
  projectedSafeToSpend: number;
  difference: number;
  shortfall: number;
  message: string;
  tone: 'positive' | 'warning' | 'critical' | 'neutral';
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateSafeToSpendScenario(
  rawSafeToSpend: number,
  kind: SafeToSpendScenarioKind,
  enteredAmount: number,
): SafeToSpendScenarioResult {
  const amount = Number.isFinite(enteredAmount) && enteredAmount > 0 ? roundMoney(enteredAmount) : 0;
  const currentRaw = Number.isFinite(rawSafeToSpend) ? roundMoney(rawSafeToSpend) : 0;
  const currentSafe = Math.max(0, currentRaw);
  const impact = kind === 'income' ? amount : -amount;
  const projectedRawSafeToSpend = roundMoney(currentRaw + impact);
  const projectedSafeToSpend = Math.max(0, projectedRawSafeToSpend);
  const difference = roundMoney(projectedSafeToSpend - currentSafe);
  const shortfall = Math.max(0, -projectedRawSafeToSpend);

  if (amount === 0) {
    return {
      impact,
      projectedRawSafeToSpend,
      projectedSafeToSpend,
      difference,
      shortfall,
      message: 'Enter an amount to preview its effect. Your actual financial records will not change.',
      tone: 'neutral',
    };
  }

  if (projectedRawSafeToSpend < 0) {
    return {
      impact,
      projectedRawSafeToSpend,
      projectedSafeToSpend,
      difference,
      shortfall,
      message: `This scenario creates a ₱${shortfall.toLocaleString('en-PH', { minimumFractionDigits: 2 })} shortfall after reserved commitments.`,
      tone: 'critical',
    };
  }

  if (kind === 'income') {
    return {
      impact,
      projectedRawSafeToSpend,
      projectedSafeToSpend,
      difference,
      shortfall,
      message: 'Additional income increases the amount available after current commitments.',
      tone: 'positive',
    };
  }

  if (projectedSafeToSpend === 0 || (currentSafe > 0 && projectedSafeToSpend <= currentSafe * 0.25)) {
    return {
      impact,
      projectedRawSafeToSpend,
      projectedSafeToSpend,
      difference,
      shortfall,
      message: 'This would leave very little flexibility for unexpected costs. Review the amount before proceeding.',
      tone: 'warning',
    };
  }

  return {
    impact,
    projectedRawSafeToSpend,
    projectedSafeToSpend,
    difference,
    shortfall,
    message: 'This scenario remains within your current Safe-to-Spend, based on the records already entered.',
    tone: 'positive',
  };
}
