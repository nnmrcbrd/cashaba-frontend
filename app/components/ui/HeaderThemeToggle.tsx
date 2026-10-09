"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function HeaderThemeToggle() {
  const pathname = usePathname();
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let header: HTMLElement | null = null;
    let observer: MutationObserver | null = null;
    const viewport = window.matchMedia("(max-width: 1023px)");

    const attachToHeader = () => {
      if (viewport.matches) {
        header?.removeAttribute("data-theme-host");
        setHost(null);
        observer?.disconnect();
        return;
      }
      header = document.querySelector<HTMLElement>(".app-page-header");
      if (!header) return;
      header.setAttribute("data-theme-host", "true");
      setHost(header);
      observer?.disconnect();
    };

    const frame = window.requestAnimationFrame(attachToHeader);
    observer = new MutationObserver(attachToHeader);
    observer.observe(document.body, { childList: true, subtree: true });
    viewport.addEventListener("change", attachToHeader);

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      viewport.removeEventListener("change", attachToHeader);
      header?.removeAttribute("data-theme-host");
    };
  }, [pathname]);

  if (!host) return null;

  return createPortal(
    <div className="app-page-theme-toggle" data-app-theme-toggle>
      <ThemeToggle />
    </div>,
    host,
  );
}
