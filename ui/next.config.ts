import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.pakyaaa.online",
        pathname: "/api/files/**",
      },
      {
        protocol: "https",
        hostname: "serve.pakyaaa.online",
        pathname: "/api/files/**",
      },
      {
        protocol: "https",
        hostname: "developers.elementor.com",
      },
    ],
  },
};

export default nextConfig;
