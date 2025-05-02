/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Fix image handling to restore avatars
  images: {
    domains: [
      "mqvcdyzqegzqfwvesoiz.supabase.co",
      "supabase.co",
      "localhost",
      "vercel.app",
      "vercel.com",
      "www.gravatar.com",
      "gravatar.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.gravatar.com",
        pathname: "/**",
      },
    ],
    // Enable image optimization but with fallback
    unoptimized: false,
  },

  // Remove deprecated/unsupported experimental flags
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

  // Move security headers from middleware to here
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://v0-spring-wellness-app.vercel.app; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co https://*.gravatar.com; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://v0-spring-wellness-app.vercel.app; frame-src 'self'; object-src 'none';",
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
