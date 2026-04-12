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

  async headers() {
    return [
      // Static assets — cache forever (filenames are content-hashed, auto-busted on deploy)
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Next.js image optimization output
      {
        source: '/_next/image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      // API GET responses — serve stale instantly, revalidate in background
      // Fresh for 10s, then serve stale for up to 50s while revalidating
      // Mutations (POST/PATCH/DELETE) are never cached by browsers anyway
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, max-age=0, must-revalidate' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
        ],
      },
      // Fonts / static assets in public/
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

export default nextConfig
