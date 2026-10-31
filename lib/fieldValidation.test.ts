import test from 'node:test';
import assert from 'node:assert/strict';
import { fieldError, nameError, passwordError, responseFieldErrors } from './fieldValidation';

test('individual fields reject whitespace, malformed emails, invalid dates and invalid money', () => {
  assert.ok(fieldError('   ', { required: true }));
  assert.ok(fieldError('person@', { type: 'email' }));
  assert.ok(fieldError('2026-02-30', { type: 'date' }));
  for (const amount of ['-1', '0', 'Infinity', '1.001']) assert.ok(fieldError(amount, { type: 'number', min: '0.01', step: '0.01' }));
  assert.equal(fieldError('125.50', { type: 'number', min: '0.01', step: '0.01' }), '');
  assert.equal(fieldError('', { required: false }), '');
});
test('names allow Philippine and international names and optional middle names', () => {
  for (const name of ['Ma. Clara', 'Dela Cruz', 'Peña', 'O’Neill', 'Anne-Marie']) assert.equal(nameError(name), '');
  assert.ok(nameError('123'));
  assert.ok(nameError('   '));
  assert.equal(nameError('', false), '');
});
test('password validation and API field errors remain associated with individual inputs', () => {
  assert.ok(passwordError('abcdefgh'));
  assert.ok(passwordError('12345678'));
  assert.equal(passwordError('SafePass123'), '');
  assert.deepEqual(responseFieldErrors({ response: { data: { errors: [{ field: 'email', message: 'Invalid email' }] } } }), { email: 'Invalid email' });
  assert.deepEqual(responseFieldErrors({ response: { data: { errors: [{ path: ['email'], message: 'Already registered' }] } } }), { email: 'Already registered' });
  assert.deepEqual(responseFieldErrors({ response: { data: { errors: 'Unavailable' } } }), {});
});
