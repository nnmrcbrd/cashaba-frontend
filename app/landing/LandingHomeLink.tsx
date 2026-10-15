"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

export default function LandingHomeLink({ children }: { children: ReactNode }) {
  function returnHome(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || window.location.pathname !== "/") return;

    event.preventDefault();
    if (window.location.hash) {
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    }
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  return <Link href="/" aria-label="Casha-Ba home" className="inline-flex" onClick={returnHome}>{children}</Link>;
}
