/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true, // Use SWC for faster minification
  images: {
    domains: ["mqvcdyzqegzqfwvesoiz.supabase.co", "supabase.co", "localhost", "vercel.app", "vercel.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/**",
      },
    ],
    unoptimized: true, // Disable image optimization to avoid sharp issues
  },
  // Simplified experimental features
  experimental: {
    // Disable CSS optimization to avoid critters issues
    // optimizeCss: true,

    // Enable memory cache
    isrMemoryCacheSize: 50,

    // Enable faster builds
    turbotrace: {
      logLevel: "error",
    },
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
  // Optimize webpack config
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size in production
    if (!dev && !isServer) {
      // Optimize code splitting
      config.optimization.splitChunks = {
        chunks: "all",
        minSize: 20000,
        maxSize: 244000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        automaticNameDelimiter: "~",
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      }

      // Add terser options for better minification
      config.optimization.minimizer = config.optimization.minimizer || []
      config.optimization.minimizer.push(
        new (require("terser-webpack-plugin"))({
          terserOptions: {
            compress: {
              drop_console: true,
            },
          },
        }),
      )
    }

    return config
  },
  // Disable source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,
  // Increase build memory limit
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Disable telemetry for faster builds
  telemetry: {
    telemetryDisabled: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
