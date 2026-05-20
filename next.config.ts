import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow localhost and loopback origins during local development.
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.1.63"],
};

export default nextConfig;
