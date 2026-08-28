/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@nakharax/sdk"],
  experimental: {
    cpus: 1,
  },
};
module.exports = nextConfig;
