import { spawn, spawnSync } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { androidTools, root, cache } from './android-tools.mjs';

const tools = androidTools();
const apk = resolve(root, 'mobile-artifacts', 'casha-ba-debug.apk');
const avd = process.env.CASHABA_AVD || 'CashaBa_API35';
const image = 'system-images;android-35;google_apis;x86_64';
if (!/^[A-Za-z0-9_-]+$/.test(avd)) throw new Error('CASHABA_AVD must be a simple Android virtual-device name.');
if (!existsSync(apk)) throw new Error('Build the app first with npm run android:apk, then run npm run mobile.');
if (!existsSync(tools.adb)) throw new Error('Install Android SDK platform-tools. See docs/ANDROID.md.');

function command(binary, args, options = {}) {
  const result = spawnSync(binary, args, {
    env: tools.env, cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30_000, ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${binary} failed: ${result.stderr || result.stdout}`);
  return (result.stdout || '').trim();
}
function devices() {
  return command(tools.adb, ['devices']).split(/[\r\n]+/)
    .map(line => line.trim().split(/\s+/)).filter(([, state]) => state === 'device').map(([serial]) => serial);
}
function runningAvd() {
  for (const serial of devices().filter(serial => serial.startsWith('emulator-'))) {
    try {
      if (command(tools.adb, ['-s', serial, 'emu', 'avd', 'name']).split(/[\r\n]+/)[0].trim() === avd) return serial;
    } catch { /* The emulator console may still be starting. Retry below. */ }
  }
}
function configureAvd(settings) {
  const config = resolve(tools.avdHome, `${avd}.avd`, 'config.ini');
  let content = readFileSync(config, 'utf8');
  const original = content;
  for (const [key, value] of Object.entries(settings)) {
    const prefix = `${key}=`;
    content = content.split(/\r?\n/).filter(line => !line.startsWith(prefix)).join('\n').trimEnd() + `\n${prefix}${value}\n`;
  }
  if (content !== original) writeFileSync(config, content);
}

let serial = process.env.ANDROID_SERIAL;
if (serial && !devices().includes(serial)) throw new Error(`The selected Android device ${serial} is not connected or authorized.`);
if (!serial) {
  if (!existsSync(tools.emulator)) throw new Error(`Install the Android emulator and ${image}. See docs/ANDROID.md.`);
  command(tools.emulator, ['-accel-check']);
  console.log('Android hardware acceleration is available.');
  serial = runningAvd();
  let emulatorFailure;
  if (!serial) {
    const names = command(tools.emulator, ['-list-avds']).split(/[\r\n]+/).map(name => name.trim());
    if (!names.includes(avd)) {
      if (!tools.avdmanager || !existsSync(resolve(tools.sdk, 'system-images', 'android-35', 'google_apis', 'x86_64', 'package.xml'))) {
        throw new Error(`Install ${image} using the Android SDK Manager. See docs/ANDROID.md.`);
      }
      console.log(`Creating the ${avd} Android phone...`);
      // Invoke the SDK tool's Java entry point directly so Windows paths and
      // package IDs are passed as arguments without shell interpretation.
      command(tools.java, [`-Dcom.android.sdkmanager.toolsdir=${resolve(dirname(tools.avdmanager), '..')}`,
        '-classpath', resolve(dirname(tools.avdmanager), '..', 'lib', 'avdmanager-classpath.jar'),
        'com.android.sdklib.tool.AvdManagerCli', 'create', 'avd', '-n', avd, '-k', image, '--device', 'pixel_4'],
      { input: 'no\n', timeout: 120_000 });
      configureAvd({
        'hw.ramSize': '1536', 'vm.heapSize': '256', 'hw.lcd.width': '720', 'hw.lcd.height': '1440',
        'hw.lcd.density': '320', 'disk.dataPartition.size': '2G', 'showDeviceFrame': 'no',
        'skin.name': '720x1440', 'skin.path': '720x1440',
        'image.sysdir.1': resolve(tools.sdk, 'system-images', 'android-35', 'google_apis', 'x86_64'),
      });
    }
    // avdmanager can prepend "sdk/" when the command-line tools live outside
    // the SDK. Keep this generated phone's system image path unambiguous.
    if (avd === 'CashaBa_API35') configureAvd({
      'image.sysdir.1': resolve(tools.sdk, 'system-images', 'android-35', 'google_apis', 'x86_64'),
    });
    console.log('Opening the Android phone window. The first boot can take a few minutes...');
    mkdirSync(resolve(cache, 'logs'), { recursive: true });
    const log = openSync(resolve(cache, 'logs', 'emulator.log'), 'a');
    const emulator = spawn(tools.emulator, ['-avd', avd, '-memory', '1536', '-cores', '2', '-gpu', 'auto',
      '-no-snapshot', '-no-boot-anim', '-no-audio', '-scale', '0.45'], {
      env: tools.env, cwd: root, detached: true, windowsHide: true, stdio: ['ignore', log, log],
    });
    emulator.on('error', error => { emulatorFailure = error; });
    emulator.on('exit', code => {
      if (code !== 0) emulatorFailure = new Error(`Emulator exited (${code}). Check ${resolve(cache, 'logs', 'emulator.log')}.`);
    });
    emulator.unref();
    closeSync(log);
  }
    const deadline = Date.now() + 600_000;
    let nextProgress = 0;
    while (Date.now() < deadline) {
      if (emulatorFailure) throw emulatorFailure;
      serial = runningAvd();
      try {
        if (serial && command(tools.adb, ['-s', serial, 'shell', 'getprop', 'sys.boot_completed']) === '1') break;
      } catch { /* adb can briefly reconnect during boot. */ }
      serial = undefined;
      if (Date.now() >= nextProgress) {
        console.log('Waiting for the Android phone to finish starting...');
        nextProgress = Date.now() + 15_000;
      }
      await delay(2000);
    }
    if (!serial) throw new Error(`Android did not finish booting. Check ${resolve(cache, 'logs', 'emulator.log')}.`);
}

console.log(`Installing Casha-Ba on ${serial}...`);
console.log(command(tools.adb, ['-s', serial, 'install', '-r', apk], { timeout: 120_000 }));
let launch;
for (let attempt = 0; attempt < 3; attempt++) {
  launch = command(tools.adb, ['-s', serial, 'shell', 'am', 'start', '-W', '-n', 'com.cashaba.app/.MainActivity'], { timeout: 120_000 });
  if (/Error:|Exception occurred/.test(launch)) throw new Error(launch);
  if (!/Status:\s*timeout/i.test(launch)) break;
  if (attempt === 2) throw new Error('Android has not finished displaying the app. Wait for the phone to become responsive, then rerun npm run mobile.');
  console.log('Android is preparing the app display. Retrying...');
  await delay(2000);
}
console.log(launch);
console.log('Casha-Ba is open in Android. Use the phone window to test the actual APK.');
