import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Optimized copies can't be invalidated, so a changed image must ship under a new file name.
    minimumCacheTTL: 2592000,
  },
  async headers() {
    const assetCache = "public, max-age=604800, stale-while-revalidate=2592000";
    return [
      { source: "/home/:path*", headers: [{ key: "Cache-Control", value: assetCache }] },
      { source: "/lp/:path*", headers: [{ key: "Cache-Control", value: assetCache }] },
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
  },
};

export default nextConfig;
