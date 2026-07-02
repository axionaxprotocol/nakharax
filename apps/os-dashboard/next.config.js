/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@nakharax/sdk"],
  output: "standalone",
};
module.exports = nextConfig;
