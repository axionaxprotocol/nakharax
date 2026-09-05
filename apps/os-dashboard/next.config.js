/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@nakharax/sdk"],
  experimental: {
    cpus: 1,
  },
  async rewrites() {
    return [
      {
        source: "/address/:address*",
        destination: "/apps/explorer/address/:address*",
      },
      {
        source: "/explorer",
        destination: "/apps/explorer",
      },
      {
        source: "/explorer/:path*",
        destination: "/apps/explorer/:path*",
      },
      {
        source: "/tx/:path*",
        destination: "/apps/explorer/tx/:path*",
      },
      {
        source: "/block/:path*",
        destination: "/apps/explorer/block/:path*",
      },
    ];
  },
};
module.exports = nextConfig;
