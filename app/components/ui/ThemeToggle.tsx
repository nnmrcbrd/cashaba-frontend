"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const darkMode = theme !== "light";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={darkMode}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(darkMode ? "light" : "dark")}
      className="grid h-10 w-10 place-items-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-gray-900 dark:text-amber-300 dark:hover:border-emerald-600 dark:hover:bg-gray-800"
    >
      {darkMode ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
