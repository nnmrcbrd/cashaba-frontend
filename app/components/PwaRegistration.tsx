"use client";

import { useEffect } from "react";

export default function PwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch((error) => {
      console.warn("Casha-Ba offline page could not be registered", error);
    });
  }, []);

  return null;
}
