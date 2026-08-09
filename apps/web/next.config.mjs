/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@idu/api-client', '@idu/design-tokens'],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
