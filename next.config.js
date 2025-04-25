/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["mqvcdyzqegzqfwvesoiz.supabase.co"],
    unoptimized: true,
  },
  experimental: {
    externalDir: true,
  },
}

module.exports = nextConfig
