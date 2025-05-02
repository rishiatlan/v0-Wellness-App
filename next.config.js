/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["mqvcdyzqegzqfwvesoiz.supabase.co", "supabase.co", "localhost", "vercel.app", "vercel.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/**",
      },
    ],
    unoptimized: true,
  },
  // Clean experimental section - only keep valid options for Next.js 15.x
  experimental: {
    optimizeCss: true,
  },
  // Optimize compiler options
  compiler: {
    // Remove console.log in production
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },
  // Simplified headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
