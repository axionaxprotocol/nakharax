/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@axionax/sdk"],
  output: "standalone",
};
module.exports = nextConfig;
