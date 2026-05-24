import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Set workspace root for output tracing to silence lockfile warning
  outputFileTracingRoot: path.join(__dirname, ".."),
  async headers() {
    if (process.env.NODE_ENV !== "development") return [];
    return [
      {
        source: "/_next/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
