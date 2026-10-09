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
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    // Hydrate with the same state as SSR. The head initializer already applies
    // the saved colors before paint; restore the React state after hydration.
    const frame = window.requestAnimationFrame(() => {
      let restored: Theme = "light";
      try {
        const stored = window.localStorage.getItem("casha_theme");
        if (stored === "dark" || stored === "amoled") restored = stored;
      } catch {
        // Theme controls still work when storage is unavailable.
      }
      applyTheme(restored);
      setThemeState(restored);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function setTheme(t: Theme) {
    applyTheme(t);
    setThemeState(t);
    try {
      window.localStorage.setItem("casha_theme", t);
    } catch {
      // Keep the chosen theme active even if it cannot be persisted.
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div
        className={theme === "light" ? undefined : "dark"}
        data-app-theme={theme}
        data-theme={theme === "amoled" ? "amoled" : undefined}
        style={{ display: "contents" }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
