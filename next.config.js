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
  // Add experimental features for performance
  experimental: {
    // Enable React Server Components
    serverComponents: true,
    // Enable concurrent features
    concurrentFeatures: true,
    // Enable optimized font loading
    fontLoaders: [{ loader: "@next/font/google", options: { subsets: ["latin"] } }],
    // Enable optimized bundle splitting
    optimizeCss: true,
    // Enable memory cache for server components
    serverComponentsExternalPackages: [],
    // Enable optimized image loading
    images: {
      allowFutureImage: true,
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
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
        ],
      },
    ]
  },
  // Add webpack optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size in production
    if (!dev && !isServer) {
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
    }
    return config
  },
  // Increase build memory limit
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Disable source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
