import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongoose", "bcryptjs", "@google/generative-ai", "chartjs-node-canvas", "chart.js"],
};

export default nextConfig;
