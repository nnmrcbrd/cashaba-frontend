"use client";

const themeInitializationScript = `
  try {
    var savedTheme = localStorage.getItem("casha_theme");
    var theme = savedTheme === "dark" || savedTheme === "amoled" ? savedTheme : "light";
    var root = document.documentElement;
    root.classList.toggle("dark", theme !== "light");
    root.style.colorScheme = theme === "light" ? "light" : "dark";
    if (theme === "amoled") {
      root.setAttribute("data-theme", "amoled");
    } else {
      root.removeAttribute("data-theme");
    }
  } catch (_) {}
`;

export default function ThemeInitializationScript() {
  return (
    <script
      id="casha-theme-init"
      // Execute while parsing SSR HTML; React client renders create an inert
      // data block. ThemeProvider restores preferences on client-only mounts.
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeInitializationScript }}
    />
  );
}
