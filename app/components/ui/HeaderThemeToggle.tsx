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

    const attachToHeader = () => {
      header = document.querySelector<HTMLElement>(".app-page-header");
      if (!header) return;
      header.setAttribute("data-theme-host", "true");
      setHost(header);
      observer?.disconnect();
    };

    const frame = window.requestAnimationFrame(attachToHeader);
    observer = new MutationObserver(attachToHeader);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      header?.removeAttribute("data-theme-host");
    };
  }, [pathname]);

  if (!host) return null;

  return createPortal(
    <div className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 lg:block" data-app-theme-toggle>
      <ThemeToggle />
    </div>,
    host,
  );
}
