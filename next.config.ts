import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development", // Optional: disables PWA caching in dev mode for easier debugging
});

const nextConfig: NextConfig = {
  // Added to silence Next.js 16 Turbopack/Webpack conflict warning when using Serwist
  turbopack: {},
};

export default withSerwist(nextConfig);
