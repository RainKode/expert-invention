import type { Metadata } from 'next'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — CSS side-effect import resolved by Next.js bundler
import './globals.css'

export const metadata: Metadata = {
  title: 'Sunday — Task & Planning Management',
  description: 'Did they do it? Are their days planned?',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
