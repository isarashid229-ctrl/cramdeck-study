import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const basePath = process.env.GITHUB_PAGES === "true" ? "/cramdeck-study" : "";
  const withBasePath = (path: string) => `${basePath}${path}`;

  return {
    name: "EagleCram",
    short_name: "EagleCram",
    description: "Academic study platform for assignments, quizzes, games, mastery tracking, and course management.",
    id: withBasePath("/dashboard"),
    start_url: withBasePath("/dashboard"),
    scope: `${basePath || "/"}`,
    display: "standalone",
    orientation: "any",
    background_color: "#f8fafc",
    theme_color: "#4f46e5",
    categories: ["education", "productivity"],
    icons: [
      {
        src: withBasePath("/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBasePath("/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBasePath("/icon-maskable-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: withBasePath("/icon-maskable-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Add Assignment",
        short_name: "Add",
        url: withBasePath("/assignments/new"),
        icons: [{ src: withBasePath("/icon-192.png"), sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Study Hub",
        short_name: "Study",
        url: withBasePath("/study"),
        icons: [{ src: withBasePath("/icon-192.png"), sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Test Me",
        short_name: "Test",
        url: withBasePath("/test-me"),
        icons: [{ src: withBasePath("/icon-192.png"), sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
