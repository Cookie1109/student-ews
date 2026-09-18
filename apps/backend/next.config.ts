import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: { root: path.resolve(__dirname, "../..") },
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/api/v1/reports/export": [
      "../../node_modules/@fontsource/noto-sans/files/noto-sans-vietnamese-400-normal.woff",
      "../../node_modules/@fontsource/noto-sans/files/noto-sans-vietnamese-700-normal.woff",
    ],
  },
};

export default nextConfig;
