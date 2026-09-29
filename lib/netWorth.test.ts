import assert from "node:assert/strict";
import test from "node:test";
import { calculateNetWorth } from "./netWorth";

test("includes outstanding borrowed money in liabilities", () => {
  const result = calculateNetWorth([{ kind: "ASSET", balance: 700 }], {
    totalBorrowed: 300,
  });

  assert.equal(result.totalAssets, 700);
  assert.equal(result.totalLiabilities, 300);
  assert.equal(result.netWorth, 400);
});

test("includes money lent as a receivable and combines account liabilities", () => {
  const result = calculateNetWorth(
    [
      { kind: "ASSET", balance: 700 },
      { kind: "LIABILITY", balance: 200 },
    ],
    { totalBorrowed: 300, totalLent: 150 },
  );

  assert.equal(result.totalAssets, 850);
  assert.equal(result.totalLiabilities, 500);
  assert.equal(result.netWorth, 350);
});
