import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.scalebranding.com",
      },
    ],
  },
  compress: true,
  reactStrictMode: false,
  sassOptions: {
    includePaths: ['./styles'],
  },
};

export default nextConfig;
