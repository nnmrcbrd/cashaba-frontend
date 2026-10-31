import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, sep } from 'node:path';
import nextEnv from '@next/env';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stage = resolve(root, '.mobile-build');
nextEnv.loadEnvConfig(root, false);

// Never embed .env.local's localhost API into a phone installation by accident.
const api = new URL(process.env.MOBILE_API_URL || 'https://api.casha-ba.online/api');
const allowDevelopmentHttp = process.env.MOBILE_ALLOW_HTTP === '1';
if (api.username || api.password || api.search || api.hash
  || !['https:', ...(allowDevelopmentHttp ? ['http:'] : [])].includes(api.protocol)
  || ['localhost', '127.0.0.1', '::1', '[::1]'].includes(api.hostname)
  || api.pathname.replace(/\/$/, '') !== '/api') {
  throw new Error('MOBILE_API_URL must be an HTTPS /api URL reachable by the phone. For local debug builds use MOBILE_ALLOW_HTTP=1 and a LAN address or Android emulator 10.0.2.2.');
}

// Next 16 uses a custom distDir as the *export destination*, while its build
// intermediates still use .next. Build a source snapshot so mobile exports do
// not replace the website's build artifacts or generated route types.
if (existsSync(stage) && lstatSync(stage).isSymbolicLink()) throw new Error('The mobile staging directory must not be a symlink.');
mkdirSync(stage, { recursive: true });
function removeGenerated(target) {
  const absolute = resolve(target);
  if ((absolute !== resolve(root, 'out') && !absolute.startsWith(stage + sep))
    || (existsSync(absolute) && lstatSync(absolute).isSymbolicLink())) {
    throw new Error(`Refusing to remove a path outside the generated mobile directories: ${absolute}`);
  }
  rmSync(absolute, { recursive: true, force: true });
}
for (const directory of ['app', 'constants', 'context', 'lib', 'public', 'services', 'styles']) {
  const source = resolve(root, directory);
  const destination = resolve(stage, directory);
  removeGenerated(destination);
  if (existsSync(source)) cpSync(source, destination, { recursive: true });
}
for (const filename of ['next.config.ts', 'postcss.config.mjs', 'tsconfig.json', 'package.json', 'package-lock.json']) {
  cpSync(resolve(root, filename), resolve(stage, filename));
}
const dependencyLink = resolve(stage, 'node_modules');
if (!existsSync(dependencyLink)) symlinkSync(resolve(root, 'node_modules'), dependencyLink, process.platform === 'win32' ? 'junction' : 'dir');
else if (realpathSync(dependencyLink) !== realpathSync(resolve(root, 'node_modules'))) throw new Error('Unexpected mobile node_modules target.');

const result = spawnSync(process.execPath, [resolve(root, 'node_modules/next/dist/bin/next'), 'build'], {
  cwd: stage,
  stdio: 'inherit',
  env: {
    ...process.env,
    CASHABA_MOBILE_BUILD: '1',
    CASHABA_MOBILE_SOURCE_ROOT: root,
    NEXT_PUBLIC_NATIVE_BUILD: '1',
    NEXT_PUBLIC_API_URL: api.toString().replace(/\/$/, ''),
    NEXT_PUBLIC_GOOGLE_OAUTH_URL: `${api.toString().replace(/\/$/, '')}/auth/google`,
  },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);

for (const page of ['index.html', 'login/index.html', 'dashboard/index.html', 'auth/google/callback/index.html', 'reset-password/index.html']) {
  if (!existsSync(resolve(stage, 'out', page))) throw new Error(`The mobile export is missing ${page}`);
}
const manifest = JSON.parse(readFileSync(resolve(stage, '.next', 'server', 'app-paths-manifest.json'), 'utf8'));
if (Object.keys(manifest).some(route => route.startsWith('/api/'))) {
  throw new Error('A server-only Next API route was included in the mobile export.');
}
removeGenerated(resolve(root, 'out'));
cpSync(resolve(stage, 'out'), resolve(root, 'out'), { recursive: true });
console.log(`Mobile assets exported to out/; API: ${api.origin}${api.pathname}`);
