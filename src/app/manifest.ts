import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LXD Attendance",
    short_name: "LXD",
    description: "Attendance and cohort management for students.",
    start_url: "/",
    display: "standalone",
    background_color: "#F9F9F8",
    theme_color: "#0A0A0A",
    icons: [
      {
        src: "/192-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/512-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
