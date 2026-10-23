import type { NextConfig } from "next";

const isMobileBuild = process.env.CASHABA_MOBILE_BUILD === "1";

const nextConfig: NextConfig = {
  output: isMobileBuild ? "export" : "standalone",
  distDir: ".next",
  ...(isMobileBuild ? {
    trailingSlash: true,
    // Mobile screens are .tsx. The .ts Next API proxy needs a server and is
    // deliberately omitted; the APK calls the Express API directly.
    pageExtensions: ["tsx"],
    images: { unoptimized: true },
    turbopack: { root: process.env.CASHABA_MOBILE_SOURCE_ROOT },
  } : {}),
  poweredByHeader: false,
  devIndicators: false,
  headers: isMobileBuild ? undefined : async function headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }, {
      source: "/sw.js",
      headers: [
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
      ],
    }];
  },
};

export default nextConfig;
