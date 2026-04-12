/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove X-Powered-By header (security + saves bytes)
  poweredByHeader: false,

  // Enable gzip/brotli compression
  compress: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Prefer modern formats — AVIF first, then WebP
    formats: ['image/avif', 'image/webp'],
  },

  // Aggressive module-level tree shaking
  experimental: {
    optimizePackageImports: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities', 'zod', 'papaparse'],
  },
}

export default nextConfig
