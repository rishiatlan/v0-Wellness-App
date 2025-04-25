/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['mqvcdyzqegzqfwvesoiz.supabase.co'],
    unoptimized: true,
  },
  // Add transpilePackages to handle Radix UI
  transpilePackages: [
    '@radix-ui'
  ]
};

export default nextConfig;
