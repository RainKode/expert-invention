/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint 9 dropped the useEslintrc option that Next.js 14 passes internally.
    // Run `npx eslint .` separately if needed.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
