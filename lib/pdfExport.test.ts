import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFinancialReportHtml, movementSign } from './pdfExport';
test('report escapes hostile stored text and includes more than 50 rows', () => {
  const payload = '<img src=x onerror="alert(1)">';
  const html = buildFinancialReportHtml({ userName: payload, userEmail: payload, totalIncome: 0, totalExpense: 60, netBalance: -60, safeToSpend: 0, transactions: Array.from({ length: 60 }, (_, index) => ({ id: String(index), type: 'expense', date: '2026-09-25', description: index === 59 ? 'LAST_ROW' : payload, category: payload, amount: 1 })) });
  assert.equal(html.includes(payload), false);
  assert.ok(html.includes('&lt;img'));
  assert.ok(html.includes('LAST_ROW'));
  assert.ok(html.includes('60 movements'));
  assert.ok(html.includes("default-src 'none'"));
  assert.equal(html.includes('<script>'), false);
});
test('report distinguishes neutral transfers, collections, withdrawals and adjustments', () => {
  assert.equal(movementSign({ type: 'transfer', category: 'Transfer' }), '↔');
  assert.equal(movementSign({ type: 'loan_collection', category: 'Loan' }), '+');
  assert.equal(movementSign({ type: 'loan_proceeds', category: 'Loan Proceeds' }), '+');
  assert.equal(movementSign({ type: 'loan_disbursement', category: 'Loan Disbursement' }), '−');
  assert.equal(movementSign({ type: 'savings_withdrawal', category: 'Savings' }), '↔');
  assert.equal(movementSign({ type: 'savings_contribution', category: 'Savings' }), '↔');
  assert.equal(movementSign({ type: 'adjustment', category: 'Balance Increase' }), '+');
  assert.equal(movementSign({ type: 'adjustment', category: 'Balance Decrease' }), '−');
});
