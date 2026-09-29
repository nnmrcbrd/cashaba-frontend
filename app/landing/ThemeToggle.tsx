"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="Toggle dark and light theme"
      title="Toggle dark and light theme"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#173d31]/15 text-[#29443a] transition-colors hover:border-[#17694d]/40 hover:bg-[#e5ebe5] hover:text-[#17694d] active:scale-[0.96] dark:border-white/15 dark:text-[#dce8e1] dark:hover:border-[#8dd2b2]/40 dark:hover:bg-white/10 dark:hover:text-[#8dd2b2]"
    >
      <Moon className="dark:hidden" size={18} strokeWidth={1.8} aria-hidden="true" />
      <Sun className="hidden dark:block" size={18} strokeWidth={1.8} aria-hidden="true" />
    </button>
  );
}
