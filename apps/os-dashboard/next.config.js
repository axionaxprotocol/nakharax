/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@nakharax/sdk"],
  output: "standalone",
  experimental: {
    cpus: 1,
  },
};
module.exports = nextConfig;

