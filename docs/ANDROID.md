# Casha-Ba Android app

The Android app uses Capacitor 8. Its Next.js HTML, JavaScript, CSS and images are bundled in the APK. It does not load the hosted website through `server.url`. Financial records and AI features still use the existing Express API and require network access.

Application ID: `com.cashaba.app`. Display name: **Casha-Ba**. Minimum Android version: Android 7 / API 24 with Android System WebView 111 or newer. Compile and target SDK: 36. The existing website still uses the standalone Next.js build.

## Run the Android app on a laptop

From `casha-ba-frontend`, run:

```powershell
npm run mobile
```

This opens an Android phone window, installs the most recently built APK, and launches Casha-Ba. It automatically creates or reuses the project-local `CashaBa_API35` virtual phone. The initial Android boot can take a few minutes. You can keep the phone window open between runs.

After editing app code, use `npm run android:run` to rebuild the APK and open the updated app. `npm run mobile` reopens the existing APK without rebuilding; it has no live reload. `npm run dev` continues to run the website in a browser.

The emulator needs hardware virtualization and the Android SDK packages `emulator`, `platform-tools`, and `system-images;android-35;google_apis;x86_64`. Install them through Android Studio's SDK Manager, or use `sdkmanager --sdk_root=YOUR_SDK_PATH "emulator" "platform-tools" "system-images;android-35;google_apis;x86_64"`. The runner detects Android Studio's SDK or the project-local toolchain. It stores virtual-phone data and logs under `../.cache/android-toolchain/`; `logs/emulator.log` contains startup errors. On Windows, enable Windows Hypervisor Platform if `emulator -accel-check` reports no usable hypervisor. This laptop's hardware acceleration was checked during setup.

To explicitly use a connected physical phone instead, set `ANDROID_SERIAL` to its `adb devices` serial before running the command. The device must authorize USB debugging.

## Build an installable APK

Requirements: Node.js 22 or newer, Java 21, Android SDK platform 36 and build tools 35.0.0 (selected by the Android Gradle plugin). Android Studio includes a suitable JDK; install SDK 36 and the build tools from its SDK Manager. Set `JAVA_HOME` and `ANDROID_HOME` if they are not detected. The build script also detects the project-local toolchain in `../.cache/android-toolchain/` used during implementation.

From `casha-ba-frontend`:

```powershell
npm ci
npm run android:apk
```

The command exports the mobile screens, synchronizes Capacitor plugins and assets, and runs Gradle `assembleDebug`. The installable result is:

```text
mobile-artifacts/casha-ba-debug.apk
```

This is a debug-signed APK for device testing and capstone demonstrations. Store distribution requires your own protected release signing key and a release APK/AAB build. Signing files, local SDK paths and compiled artifacts are ignored by Git.

Other commands:

```powershell
npm run mobile:build  # Export only the bundled screens into out/
npm run android:sync  # Rebuild and copy screens/plugins to android/
npm run android:open  # Open the native project in Android Studio
npm run mobile        # Open the built APK in the laptop's Android phone window
npm run android:run   # Rebuild the APK, then open it in Android
```

The GitHub **Android APK** workflow can also build a downloadable debug APK after this branch is pushed. It does not publish an app or deploy the backend.

## Choose the API server

APK builds use `MOBILE_API_URL`, defaulting to `https://api.casha-ba.online/api`. They deliberately do not inherit the website's `NEXT_PUBLIC_API_URL=http://localhost:8000/api` from `.env.local`: a phone's localhost is the phone itself.

For an Android emulator using a local backend:

```powershell
$env:MOBILE_API_URL = 'http://10.0.2.2:8000/api'
$env:MOBILE_ALLOW_HTTP = '1'
npm run android:apk
```

For a physical phone, replace `10.0.2.2` with the development PC's LAN IP and put both devices on the same network. HTTP is enabled only in Android's debug manifest. Normal builds require an HTTPS API; the release manifest blocks cleartext traffic.

## Deploy the matching backend changes

Deploy the backend `panelist-improvements` branch before testing mobile authentication against a hosted API. No database migration is required.

- The exact packaged Android origin `https://localhost` is included in the shared CORS/session-origin allowlist. Other origins retain the existing restrictions.
- Email/password login, refresh rotation and logout retain HttpOnly cookies. Capacitor's native HTTP patch supports these cookies, multipart scanning uploads and binary exports without placing refresh tokens in JavaScript storage.
- Google sign-in opens the system browser. It uses the existing web OAuth client and HTTPS backend callback; no Google client secret is shipped in the APK. The backend returns only a 90-second opaque code to `cashaba://auth/google/callback`. The app redeems it once with its S256 PKCE verifier at `POST /api/auth/google/mobile-exchange`. Tokens never appear in the deep-link URL.
- Handoffs use the existing one-time `Token` infrastructure as short-lived refresh grants, with a separate fingerprint namespace, expiry and revocation checks. Suspension and password-change revocation remain effective.

The Google console's authorized redirect URI remains the HTTPS backend `/api/auth/google/callback` URL configured by `GOOGLE_REDIRECT_URI`. The Android return URI is controlled by Casha-Ba after that callback.

## Mobile behavior

- Android back navigates between screens and minimizes at the main dashboard/login screens.
- Native window insets protect controls from status/navigation bars, cutouts and the keyboard.
- Full-page Next navigation resolves the correct bundled HTML, including login and OAuth returns. Client-side navigation retains Next's static route payloads.
- CSV and Excel exports open Android's save/share sheet using an app-private cache file. PDF reports open Android's print dialog, which includes **Save as PDF**.
- Receipt/image imports continue through Android's file/photo picker and the existing reviewed upload flow.
- Checkout opens in the system browser. Close the browser to return to the app; the subscription screen refreshes on resume and provides **Check payment status**. A plan activates only after backend verification.
- The APK uses packaged assets rather than the PWA service worker. Opening the shell offline does not imply offline access to financial records.
- Native backup/device transfer is disabled so WebView session data is not copied to another device.

## Web and mobile build separation

`npm run build` still creates `.next/` with the website's server API proxy and HTTP headers. `npm run mobile:build` builds a generated source snapshot in `.mobile-build/` and copies the finished bundle to `out/`, with unoptimized local images and trailing-slash HTML routes. The snapshot uses its own Next cache and generated route types so it does not replace the website build. Only `.tsx` route files participate in the mobile export; this intentionally excludes the legacy `.ts` Next API proxy at `app/api/chat/route.ts`. All current screen routes use `.tsx`. Add future mobile screen routes with that extension, and keep server operations in Express.

The mobile build validates its API URL and checks that login, dashboard and OAuth HTML exist and that no Next server API route is included.

## Device verification before distribution

The code and build checks do not replace running on an Android phone. Verify email login, app restart/refresh, Google browser return, sign-out, receipt uploads, transaction entry, back/keyboard behavior, CSV/Excel sharing, Android PDF printing and subscription status refresh against the exact deployed API. Google, SMTP, AI scanning and payment verification require their configured external services.

References: [Capacitor installation](https://capacitorjs.com/docs/getting-started), [native HTTP](https://capacitorjs.com/docs/apis/http), [Android project](https://capacitorjs.com/docs/android), [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports), [Android emulator](https://developer.android.com/studio/run/emulator-commandline), [emulator acceleration](https://developer.android.com/studio/run/emulator-acceleration).
