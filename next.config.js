/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Safe image handling without triggering sharp
  images: {
    domains: ["mqvcdyzqegzqfwvesoiz.supabase.co", "supabase.co", "localhost", "vercel.app", "vercel.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/**",
      },
    ],
    // Disables built-in Image Optimization (no sharp needed)
    unoptimized: true,
  },

  // Remove deprecated/unsupported experimental flags
  // Only include valid ones for Next.js 15
  experimental: {
    optimizeCss: false, // Turn OFF to avoid critters issue
  },

  // Transpile Radix UI components (if you're using them)
  transpilePackages: ["@radix-ui"],

  compiler: {
    // Strip console logs in prod except error/warn
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

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
