import type { Metadata } from "next";
import { AuthProvider } from "../context/Authcontext";
import { ThemeProvider } from "../context/ThemeContext";
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
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}