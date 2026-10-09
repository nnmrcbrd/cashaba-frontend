"use client";

import ThemeToggle from "./ThemeToggle";

export default function ThemeMenuRow() {
  return (
    <div className="casha-sidebar__theme-row">
      <span>Theme / Mode</span>
      <ThemeToggle />
    </div>
  );
}
