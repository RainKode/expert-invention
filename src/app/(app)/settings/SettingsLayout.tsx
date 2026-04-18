'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SETTINGS_NAV = [
  { label: 'User Preferences', href: '/settings', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { label: 'Team Settings', href: '/settings/team', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'System Settings', href: '/settings/system', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6 md:-m-8">
      {/* Sub-navigation */}
      <aside className="hidden md:flex w-[240px] bg-[#f2f4f6] flex-col flex-shrink-0 py-10">
        <nav className="space-y-1">
          {SETTINGS_NAV.map((item) => {
            const isActive = item.href === '/settings'
              ? pathname === '/settings'
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  isActive
                    ? 'font-semibold text-on-surface bg-integrity/10 border-l-[3px] border-integrity'
                    : 'text-on-surface-variant hover:bg-[#e6e8ea]'
                }`}
              >
                <svg className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-integrity' : 'text-on-surface-variant'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Content area */}
      <section className="flex-1 bg-white overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {/* Mobile nav */}
          <div className="md:hidden flex gap-2 mb-8 overflow-x-auto pb-2">
            {SETTINGS_NAV.map((item) => {
              const isActive = item.href === '/settings'
                ? pathname === '/settings'
                : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-gradient-to-br from-[#2226F7] to-[#00D6A3] text-white'
                      : 'bg-[#f2f4f6] text-on-surface-variant'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
          {children}
        </div>
      </section>
    </div>
  )
}
