import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  poweredByHeader: false,

  images: {
    unoptimized: false
  },

  async redirects() {
    return [
      {
        source: "/proceedings",
        destination: "/conferences",
        permanent: true
      }
    ];
  }
};

export default nextConfig;