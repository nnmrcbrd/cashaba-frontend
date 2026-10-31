import test from 'node:test';
import assert from 'node:assert/strict';
import { getRouteAccess } from './routeAccess';

test('mobile trailing-slash URLs retain authentication and role protection', () => {
  for (const path of ['/accounts', '/dashboard', '/settings', '/transactions', '/onboarding/role', '/subscription', '/shared-savings', '/admin/manage-users']) {
    assert.equal(getRouteAccess(path).isProtected, true);
    assert.deepEqual(getRouteAccess(`${path}/`), getRouteAccess(path));
  }
  assert.equal(getRouteAccess('/admin/manage-users/', 'USER').hasWrongRole, true);
  assert.equal(getRouteAccess('/dashboard/', 'ADMIN').hasWrongRole, true);
  assert.equal(getRouteAccess('/admin/manage-users/', 'ADMIN').hasWrongRole, false);
  assert.equal(getRouteAccess('/change-password/', 'ADMIN').hasWrongRole, false);
  assert.equal(getRouteAccess('/dashboard/', 'USER').hasWrongRole, false);
});

test('public login, recovery and Google callback pages stay accessible', () => {
  for (const path of ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/auth/google/callback']) {
    assert.equal(getRouteAccess(path).isProtected, false);
    assert.equal(getRouteAccess(`${path}/`).isProtected, false);
  }
});
