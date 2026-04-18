'use client'

import { memo } from 'react'
import { type Role } from '@/types'
import { ROLE_LABELS } from '@/lib/permissions'
import GlobalSearchBar from '@/components/search/GlobalSearchBar'

interface TopBarProps {
  userName: string
  userRole: Role
  unreadNotificationCount?: number
  onNotificationClick?: () => void
  onMenuOpen?: () => void
}

export default memo(function TopBar({ userName, userRole, unreadNotificationCount = 0, onNotificationClick, onMenuOpen }: TopBarProps) {
  return (
    <header className="fixed top-0 right-0 left-0 md:left-72 h-16 z-30 px-4 md:px-6 flex items-center justify-between bg-white/80 backdrop-blur-xl shadow-[0px_2px_15px_rgba(77,85,106,0.04)]">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuOpen}
        className="md:hidden p-2 -ml-1 hover:bg-surface-container-high rounded-full transition-colors"
        aria-label="Open menu"
      >
        <span className="material-symbols-outlined text-on-surface">menu</span>
      </button>

      {/* Global Search Bar — centered, 40% width */}
      <GlobalSearchBar />

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications Bell */}
        <button
          onClick={onNotificationClick}
          className="relative p-2 hover:bg-integrity/5 rounded-full transition-all active:scale-90"
        >
          <span className="material-symbols-outlined text-[24px] text-integrity" style={{ fontVariationSettings: unreadNotificationCount > 0 ? "'FILL' 1" : "'FILL' 0" }}>
            notifications
          </span>
          {unreadNotificationCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-[#2226F7] to-[#00D6A3] rounded-full border-2 border-surface-container-lowest text-[10px] font-bold text-on-primary">
              {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
            </span>
          )}
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
})
