import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images:{
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.scalebranding.com',
      },
    ]
  },
  compress:true,
  reactStrictMode:false,
  webpack: (config) => {
    config.externals.push("pino-pretty");
    config.externals.push("encoding");
    return config;
  },
};

export default nextConfig;
