import type { Metadata } from "next";
import { AuthProvider } from "../context/Authcontext";
import { ThemeProvider } from "../context/ThemeContext";
import { RouteGuard } from "../context/RouteGuard";
import IdleSessionManager from "./components/auth/IdleSessionManager";
import "./globals.css";

export const metadata: Metadata = {
  title: "Casha-Ba",
  description: "Personal finance, made simple.",
};

const themeInitializationScript = `
  try {
    var savedTheme = localStorage.getItem("casha_theme");
    var root = document.documentElement;
    if (savedTheme === "dark" || savedTheme === "amoled") {
      root.classList.add("dark");
    }
    if (savedTheme === "amoled") {
      root.setAttribute("data-theme", "amoled");
    }
  } catch (_) {}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <IdleSessionManager />
            <RouteGuard>{children}</RouteGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
