import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { androidTools, root, windows } from './android-tools.mjs';

const { sdk, env } = androidTools();
writeFileSync(resolve(root, 'android', 'local.properties'), `sdk.dir=${sdk.replaceAll('\\', '/') }\n`);

const result = spawnSync(windows ? 'cmd.exe' : 'sh', windows
  ? ['/d', '/s', '/c', 'gradlew.bat :app:assembleDebug --no-daemon']
  : ['./gradlew', ':app:assembleDebug', '--no-daemon'], {
  cwd: resolve(root, 'android'), stdio: 'inherit',
  env,
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
const destination = resolve(root, 'mobile-artifacts', 'casha-ba-debug.apk');
mkdirSync(dirname(destination), { recursive: true });
copyFileSync(resolve(root, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'), destination);
console.log(`Installable debug APK: ${destination}`);
