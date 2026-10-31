import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Render the real page with isolated hooks and API mocks; no browser/account is needed.
const source = readFileSync(new URL('../app/onboarding/role/page.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
} }).outputText;

function pageFixture(options: { failSave?: boolean; signedIn?: boolean; customRole?: string } = {}) {
  const events: string[] = [];
  const payloads: unknown[] = [];
  const errors: string[] = [];
  const user = options.signedIn === false ? null : {
    name: 'Maria Clara Dela Cruz Santos', role: ['Freelance'], customRole: options.customRole || '',
  };
  const jsx = (type: unknown, props: Record<string, unknown>) => ({ type, props });
  let stateIndex = 0;
  const pageModule = { exports: {} as { default: () => { props: { children: { props: { onSubmit: (event: { preventDefault: () => void }) => Promise<void> } } } } } };
  runInNewContext(compiled, { module: pageModule, exports: pageModule.exports, require: (name: string) => {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react') return { useState: (value: unknown) => {
      const index = stateIndex++;
      return [typeof value === 'function' ? value() : value, (next: unknown) => { if (index === 2 && typeof next === 'string' && next) errors.push(next); }];
    } };
    if (name === 'next/navigation') return { useRouter: () => ({ push: (path: string) => events.push(`push:${path}`) }) };
    if (name === '@/context/Authcontext') return { useAuth: () => ({ user, refreshUser: async () => { events.push('refresh'); return user; } }) };
    if (name === '@/lib/apiClient') return { patch: async (path: string, body: unknown) => {
      events.push(`patch:${path}`); payloads.push(JSON.parse(JSON.stringify(body)));
      if (options.failSave) throw new Error('fixture API failure');
    } };
    if (name === '@/constants') return { ROUTES: { ONBOARDING_INCOME: '/onboarding/income' } };
    if (name === '@/app/components/onboarding/OnboardingShell') return { default: 'shell', onboardingPrimaryButtonClass: '' };
    if (name === 'lucide-react') return {};
    if (name === '@/app/components/ui/ValidatedForm') return { ValidatedForm: 'form', ValidatedInput: 'input' };
    throw new Error(`Unexpected dependency: ${name}`);
  } });
  const form = pageModule.exports.default().props.children;
  return { events, payloads, errors, submit: () => form.props.onSubmit({ preventDefault() {} }) };
}

test('role selection saves only roles then refreshes and advances to income', async () => {
  const fixture = pageFixture();
  await fixture.submit();
  assert.deepEqual(fixture.payloads, [{ roles: ['FREELANCE'], customRole: null }]);
  assert.deepEqual(fixture.events, ['patch:/users/me', 'refresh', 'push:/onboarding/income']);
});

test('custom role is trimmed without sending or guessing any part of the full name', async () => {
  const fixture = pageFixture({ customRole: '  Shop owner  ' });
  await fixture.submit();
  assert.deepEqual(fixture.payloads, [{ roles: ['FREELANCE'], customRole: 'Shop owner' }]);
});

test('a failed profile save stays on the current step and shows the error', async () => {
  const fixture = pageFixture({ failSave: true });
  await fixture.submit();
  assert.deepEqual(fixture.events, ['patch:/users/me']);
  assert.deepEqual(fixture.errors, ['Unable to save your profile type. Please try again.']);
});

test('a signed-out page does not try to save a profile', async () => {
  const fixture = pageFixture({ signedIn: false });
  await fixture.submit();
  assert.deepEqual(fixture.events, []);
});
