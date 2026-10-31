import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cashaba.app',
  appName: 'Casha-Ba',
  loggingBehavior: 'none',
  webDir: 'out',
  server: {
    hostname: 'localhost',
    androidScheme: 'https',
    // Production loads the assets inside the APK, never a remote website.
  },
  android: {
    backgroundColor: '#f7f9f8',
    allowMixedContent: false,
    minWebViewVersion: 111,
    appendUserAgent: ' CashaBaAndroid/1.0',
  },
  plugins: {
    // Native networking keeps HttpOnly refresh cookies in Android's cookie jar
    // and supports the existing Axios, multipart upload and binary export flows.
    CapacitorHttp: { enabled: true },
    SplashScreen: {
      launchShowDuration: 500,
      launchAutoHide: true,
      backgroundColor: '#073f30',
      showSpinner: false,
      androidSplashResourceName: 'cashaba_splash',
    },
  },
};

export default config;
