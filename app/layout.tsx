import type { Metadata, Viewport } from "next";
import { AuthProvider } from "../context/Authcontext";
import { ThemeProvider } from "../context/ThemeContext";
import { RouteGuard } from "../context/RouteGuard";
import IdleSessionManager from "./components/auth/IdleSessionManager";
import PwaRegistration from "./components/PwaRegistration";
import ThemeInitializationScript from "./components/ThemeInitializationScript";
import "./globals.css";

export const metadata: Metadata = {
  title: "Casha-Ba",
  description: "Personal finance, made simple.",
  applicationName: "Casha-Ba",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  appleWebApp: { capable: true, title: "Casha-Ba", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#073f30",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <ThemeInitializationScript />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <PwaRegistration />
            <IdleSessionManager />
            <RouteGuard>{children}</RouteGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
