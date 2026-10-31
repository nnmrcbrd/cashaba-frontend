"use client";

import { useEffect } from "react";

export default function PwaRegistration() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_NATIVE_BUILD === '1') return;
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch((error) => {
      console.warn("Casha-Ba offline page could not be registered", error);
    });
  }, []);

  return null;
}
