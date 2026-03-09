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
        hostname: "developers.elementor.com",
        // pathname: "/docs/assets/img/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3002",
        pathname: "/api/files/**",
      },
    ],
  },
};

export default nextConfig;
