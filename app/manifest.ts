import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Casha-Ba",
    short_name: "Casha-Ba",
    description: "Personal finance tracking, budgets, goals, and insights.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f7f9f8",
    theme_color: "#073f30",
    lang: "en-PH",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
