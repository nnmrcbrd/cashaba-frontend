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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("casha_theme") as Theme | null;
    if (stored && ["light", "dark", "amoled"].includes(stored)) {
      applyTheme(stored);
      setThemeState(stored);
    }
  }, []);

  function applyTheme(t: Theme) {
    const root = document.documentElement;
    // Remove all theme classes first
    root.removeAttribute("data-theme");
    root.classList.remove("dark");

    if (t === "dark") {
      root.classList.add("dark");
    } else if (t === "amoled") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "amoled");
    }
  }

  function setTheme(t: Theme) {
    applyTheme(t);
    setThemeState(t);
    localStorage.setItem("casha_theme", t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
