import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateSafeToSpendScenario } from './safeToSpendScenario';

test('subtracts a possible expense without changing the current amount', () => {
  const result = calculateSafeToSpendScenario(5_000, 'expense', 1_500);
  assert.equal(result.projectedSafeToSpend, 3_500);
  assert.equal(result.difference, -1_500);
});

test('adds hypothetical income', () => {
  const result = calculateSafeToSpendScenario(5_000, 'income', 2_000);
  assert.equal(result.projectedSafeToSpend, 7_000);
  assert.equal(result.difference, 2_000);
});

test('reports a shortfall instead of displaying negative Safe-to-Spend', () => {
  const result = calculateSafeToSpendScenario(1_000, 'obligation', 1_750);
  assert.equal(result.projectedSafeToSpend, 0);
  assert.equal(result.shortfall, 750);
  assert.equal(result.tone, 'critical');
});

test('starts from the raw amount when existing commitments already cause a shortfall', () => {
  const result = calculateSafeToSpendScenario(-500, 'income', 300);
  assert.equal(result.projectedSafeToSpend, 0);
  assert.equal(result.shortfall, 200);
});
