'use client'

import { type Role } from '@/types'
import { ROLE_LABELS } from '@/lib/permissions'

interface TopBarProps {
  userName: string
  userRole: Role
}

export default function TopBar({ userName, userRole }: TopBarProps) {
  return (
    <header className="fixed top-0 right-0 left-0 md:left-72 h-16 z-30 px-6 flex items-center justify-between bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0px_2px_15px_rgba(77,85,106,0.04)]">
      {/* Search */}
      <div className="relative max-w-md w-full hidden sm:block">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">
          search
        </span>
        <input
          type="text"
          placeholder="Search tasks, people, teams..."
          className="w-full pl-11 pr-4 py-2 bg-surface-container-low border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline"
        />
      </div>

      {/* Mobile: just spacer */}
      <div className="md:hidden" />

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-on-surface-variant hover:opacity-70 transition-opacity">
          <span className="material-symbols-outlined text-xl">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface-container-lowest" />
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-on-surface">{userName}</p>
            <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-[10px] font-bold text-tertiary-container uppercase tracking-wider">
              {ROLE_LABELS[userRole]}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center">
            <span className="text-on-primary-container text-sm font-bold">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
