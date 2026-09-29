export interface BalanceAccount {
  kind: "ASSET" | "LIABILITY";
  balance: number;
}

export interface NetWorthSummary {
  walletAssets: number;
  receivables: number;
  totalAssets: number;
  accountLiabilities: number;
  borrowedDebt: number;
  totalLiabilities: number;
  netWorth: number;
}

export function calculateNetWorth(
  accounts: BalanceAccount[],
  loans: { totalBorrowed?: number; totalLent?: number } = {},
): NetWorthSummary {
  const walletAssets = accounts
    .filter((account) => account.kind === "ASSET")
    .reduce((total, account) => total + account.balance, 0);
  const accountLiabilities = accounts
    .filter((account) => account.kind === "LIABILITY")
    .reduce((total, account) => total + account.balance, 0);
  const receivables = Math.max(0, loans.totalLent || 0);
  const borrowedDebt = Math.max(0, loans.totalBorrowed || 0);
  const totalAssets = walletAssets + receivables;
  const totalLiabilities = accountLiabilities + borrowedDebt;

  return {
    walletAssets,
    receivables,
    totalAssets,
    accountLiabilities,
    borrowedDebt,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  };
}
