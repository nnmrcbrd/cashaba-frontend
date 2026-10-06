import assert from 'node:assert/strict';
import test from 'node:test';
import { buildIncomeExpenseTrend, manilaDateLabel, operatingGap, trendScaleMaximum } from './incomeExpenseTrend';

test('one day of transactions remains visible in the full Manila calendar month', () => {
  const buckets = buildIncomeExpenseTrend([{ date: '2026-10-06', income: 2500, expense: 2648 }], '2026-09-30T16:00:00Z', '2026-10-31T15:59:59.999Z');
  assert.equal(buckets.length, 31);
  assert.deepEqual(buckets[5], { date: '2026-10-06', endDate: '2026-10-06', income: 2500, expense: 2648 });
  assert.equal(buckets[0].income, 0);
  assert.equal(buckets[30].date, '2026-10-31');
  assert.equal(trendScaleMaximum(buckets), 4000);
  assert.deepEqual(operatingGap(2500, 2648), { amount: -148, label: 'Shortfall' });
});

test('single-day reporting uses separate income and expense values and preserves cents', () => {
  const buckets = buildIncomeExpenseTrend([{ date: '2026-10-06', income: 0.1, expense: 0.2 }, { date: '2026-10-06', income: 0.2, expense: 0.1 }], '2026-10-05T16:00:00Z', '2026-10-06T15:59:59Z');
  assert.equal(buckets.length, 1);
  assert.equal(buckets[0].income, 0.3);
  assert.equal(buckets[0].expense, 0.3);
  assert.deepEqual(operatingGap(0.3, 0.3), { amount: 0, label: 'Income equals spending' });
});

test('long reporting periods use bounded date ranges without losing money', () => {
  const trend = [{ date: '2026-01-01', income: 10000, expense: 100 }, { date: '2026-12-31', income: 5000, expense: 200 }];
  const buckets = buildIncomeExpenseTrend(trend, '2025-12-31T16:00:00Z', '2026-12-31T15:59:59Z');
  assert.ok(buckets.length <= 31);
  assert.equal(buckets.reduce((sum, bucket) => sum + bucket.income, 0), 15000);
  assert.equal(buckets.reduce((sum, bucket) => sum + bucket.expense, 0), 300);
  assert.equal(buckets.at(-1)?.endDate, '2026-12-31');
});

test('missing days show zero recorded amounts and out-of-period data is excluded', () => {
  const buckets = buildIncomeExpenseTrend([{ date: '2026-09-30', income: 999, expense: 999 }], '2026-09-30T16:00:00Z', '2026-10-02T15:59:59Z');
  assert.equal(buckets.length, 2);
  assert.ok(buckets.every(bucket => bucket.income === 0 && bucket.expense === 0));
  assert.equal(operatingGap(0, 0).label, 'No recorded activity');
  assert.ok(trendScaleMaximum(buckets) > 0);
  assert.equal(manilaDateLabel('2026-09-30T16:00:00Z'), '2026-10-01');
});
