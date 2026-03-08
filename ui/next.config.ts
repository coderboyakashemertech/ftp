import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        port: "3002",
        protocol: "http",
        hostname: "localhost",
        pathname: "/api/static/**",
      },
      {
        protocol: "https",
        hostname: "demo.pakyaaa.online",
        pathname: "/api/static/**",
      },
    ],
  },
};

export default nextConfig;
