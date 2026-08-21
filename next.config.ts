import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker/Coolify hosting (produces a minimal
  // server.js + traced node_modules in .next/standalone). The Dockerfile
  // copies .next/standalone into the runner stage.
  output: "standalone",
};

export default nextConfig;
