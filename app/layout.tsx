import type { Metadata } from "next";
import { AuthProvider } from "../context/Authcontext";
import { ThemeProvider } from "../context/ThemeContext";
import { RouteGuard } from "../context/RouteGuard";
import "./globals.css";

export const metadata: Metadata = {
  title: "Casha-Ba",
  description: "Personal finance, made simple.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <RouteGuard>{children}</RouteGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
