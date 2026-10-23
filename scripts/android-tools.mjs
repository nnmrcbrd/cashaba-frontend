import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const cache = resolve(root, '..', '.cache', 'android-toolchain');
export const windows = process.platform === 'win32';

export function androidTools() {
  const javaBinary = windows ? 'java.exe' : 'java';
  const cachedJdk = existsSync(resolve(cache, 'jdk'))
    ? readdirSync(resolve(cache, 'jdk')).map(name => resolve(cache, 'jdk', name))
      .find(path => existsSync(resolve(path, 'bin', javaBinary))) : undefined;
  const javaHome = process.env.JAVA_HOME || (windows && existsSync('C:/Program Files/Android/Android Studio/jbr')
    ? 'C:/Program Files/Android/Android Studio/jbr' : cachedJdk);
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT
    || (windows && existsSync(resolve(process.env.LOCALAPPDATA || '', 'Android', 'Sdk'))
      ? resolve(process.env.LOCALAPPDATA, 'Android', 'Sdk') : resolve(cache, 'sdk'));
  if (!javaHome || !existsSync(resolve(javaHome, 'bin', javaBinary)) || !existsSync(sdk)) {
    throw new Error('Android tools are missing. Install JDK 21 and Android SDK 36; set JAVA_HOME and ANDROID_HOME. See docs/ANDROID.md.');
  }
  const userHome = process.env.ANDROID_USER_HOME || resolve(cache, 'android-user');
  const avdHome = process.env.ANDROID_AVD_HOME || resolve(cache, 'avd');
  for (const path of [userHome, avdHome, resolve(cache, 'gradle')]) mkdirSync(path, { recursive: true });
  return {
    sdk, avdHome,
    java: resolve(javaHome, 'bin', javaBinary),
    adb: resolve(sdk, 'platform-tools', windows ? 'adb.exe' : 'adb'),
    emulator: resolve(sdk, 'emulator', windows ? 'emulator.exe' : 'emulator'),
    avdmanager: [resolve(sdk, 'cmdline-tools', 'latest', 'bin', windows ? 'avdmanager.bat' : 'avdmanager'),
      resolve(cache, 'commandline', 'cmdline-tools', 'bin', windows ? 'avdmanager.bat' : 'avdmanager')]
      .find(path => existsSync(path)),
    env: { ...process.env, JAVA_HOME: javaHome, ANDROID_HOME: sdk, ANDROID_SDK_ROOT: sdk,
      GRADLE_USER_HOME: process.env.GRADLE_USER_HOME || resolve(cache, 'gradle'),
      ANDROID_USER_HOME: userHome, ANDROID_AVD_HOME: avdHome },
  };
}
