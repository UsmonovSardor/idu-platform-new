/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Railway/Docker uchun minimal runtime
  transpilePackages: ['@idu/api-client', '@idu/design-tokens'],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
