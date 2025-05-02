/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["mqvcdyzqegzqfwvesoiz.supabase.co"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
    unoptimized: true,
  },
  // Remove optimizeCss to avoid the critters issue
  experimental: {
    // optimizeCss: true, // Removing this line
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
