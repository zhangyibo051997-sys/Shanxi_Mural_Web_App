import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Smaller SSR/server output for EdgeOne / serverless hosts.
  output: "standalone",
  // Keep large static art out of the Node SSR function package.
  outputFileTracingExcludes: {
    "*": [
      "./public/images/**",
      "./public/images/libretto/**",
      "./public/images/objects/**",
      "./public/images/postcards/**",
      "./public/images/coloring/**",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
