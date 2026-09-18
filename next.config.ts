import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages serves static files only. Everything here prerenders, so the
  // export is lossless, but it does rule out route handlers that are not
  // force-static, ISR, and request-time image or OG generation.
  output: "export",
};

export default nextConfig;
