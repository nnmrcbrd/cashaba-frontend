"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "amoled";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
});

function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.removeAttribute("data-theme");
  root.classList.remove("dark");
  root.style.colorScheme = t === "light" ? "light" : "dark";
  if (t === "dark") root.classList.add("dark");
  if (t === "amoled") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "amoled");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("casha_theme");
    return stored === "dark" || stored === "amoled" ? stored : "light";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function setTheme(t: Theme) {
    applyTheme(t);
    setThemeState(t);
    localStorage.setItem("casha_theme", t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div
        className={theme === "light" ? undefined : "dark"}
        data-app-theme={theme}
        data-theme={theme === "amoled" ? "amoled" : undefined}
        style={{ display: "contents" }}
        suppressHydrationWarning
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
