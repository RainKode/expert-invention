'use client'

import { memo, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type Role } from '@/types'
import { can } from '@/lib/permissions'

interface NavItem {
  label: string
  href: string
  icon: string
  requiredAction?: Parameters<typeof can>[1]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'My Tasks', href: '/tasks', icon: 'task_alt' },
  { label: 'Board', href: '/board', icon: 'view_kanban' },
  { label: 'Weekly Plan', href: '/plan', icon: 'calendar_view_week' },
  { label: 'Daily Check-in', href: '/checkin', icon: 'assignment_turned_in' },
  { label: 'EOD Wrap-up', href: '/wrapup', icon: 'history_edu' },
  { label: 'Team Tasks', href: '/team/tasks', icon: 'groups', requiredAction: 'view_team_tasks' },
  { label: 'Team Plans', href: '/team/plans', icon: 'groups', requiredAction: 'view_team_tasks' },
  { label: 'Team Pulse', href: '/dashboard/team-pulse', icon: 'monitor_heart', requiredAction: 'view_team_tasks' },
  { label: 'Workload', href: '/dashboard/workload', icon: 'bar_chart', requiredAction: 'view_team_tasks' },
  { label: 'Activity', href: '/dashboard/activity', icon: 'history' },
  { label: 'Reports', href: '/reports', icon: 'bar_chart', requiredAction: 'export_reports' },
  { label: 'Custom Fields', href: '/settings/custom-fields', icon: 'tune', requiredAction: 'create_custom_fields' },
  { label: 'Notifications', href: '/settings/notifications', icon: 'notifications' },
]

// Map nav icons to palette colours for active state
const NAV_ICON_COLOR: Record<string, string> = {
  '/dashboard': 'text-integrity',
  '/tasks': 'text-energetic',
  '/board': 'text-kindness',
  '/plan': 'text-natural',
  '/checkin': 'text-integrity',
  '/wrapup': 'text-originality',
  '/team/tasks': 'text-energetic',
  '/team/plans': 'text-integrity',
  '/dashboard/team-pulse': 'text-excitement',
  '/dashboard/workload': 'text-natural',
  '/dashboard/activity': 'text-kindness',
  '/reports': 'text-integrity',
  '/settings/custom-fields': 'text-originality',
  '/settings/notifications': 'text-energetic',
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Users', href: '/admin/users', icon: 'manage_accounts' },
  { label: 'Teams', href: '/admin/teams', icon: 'corporate_fare' },
  { label: 'Audit Trail', href: '/admin/audit-trail', icon: 'policy' },
  { label: 'Setup', href: '/admin/setup', icon: 'settings_suggest' },
]

interface SidebarProps {
  userName: string
  userRole: Role
  onLogout: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export default memo(function Sidebar({ userName, userRole, onLogout, mobileOpen = false, onMobileClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()

  const visibleNav = useMemo(() => NAV_ITEMS.filter(
    (item) => !item.requiredAction || can(userRole, item.requiredAction)
  ), [userRole])

  const isActive = useCallback((href: string) => pathname === href || pathname.startsWith(href + '/'), [pathname])

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href)
    const iconColor = NAV_ICON_COLOR[item.href] ?? 'text-integrity'
    return (
      <Link
        href={item.href}
        onClick={() => onMobileClose?.()}
        title={collapsed ? item.label : undefined}
        className={
          active
            ? `flex items-center ${collapsed ? 'justify-center' : ''} gap-4 px-4 py-3 bg-white font-semibold rounded-2xl shadow-[0px_2px_12px_rgba(77,85,106,0.1)] transition-all`
            : `flex items-center ${collapsed ? 'justify-center' : ''} gap-4 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-2xl`
        }
      >
        <span className={`material-symbols-outlined text-xl shrink-0 ${active ? iconColor : ''}`}
          style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >{item.icon}</span>
        {!collapsed && <span className={`whitespace-nowrap ${active ? 'text-on-surface' : ''}`}>{item.label}</span>}
      </Link>
    )
  }

  const SidebarContent = ({ isCollapsed = false }: { isCollapsed?: boolean }) => (
    <>
      {/* Brand */}
      <div className={`${isCollapsed ? 'px-3 pt-8 pb-6' : 'px-8 pt-10 pb-12'} transition-all duration-300`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div
            className="w-10 h-10 rounded-xl bg-integrity flex items-center justify-center shadow-[0px_4px_24px_rgba(77,85,106,0.08)] shrink-0"
          >
            <span
              className="material-symbols-outlined text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              hub
            </span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold tracking-tighter text-primary">Sunday</h1>
              <p className="text-[10px] text-outline uppercase tracking-widest font-semibold">
                The Digital Atrium
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle button */}
      {onToggleCollapse && (
        <div className={`${isCollapsed ? 'px-2' : 'px-4'} mb-2`}>
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-2xl text-on-surface-variant hover:bg-surface-container-high transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="material-symbols-outlined text-lg transition-transform duration-300" style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              chevron_left
            </span>
            {!isCollapsed && <span className="text-xs font-semibold">Collapse</span>}
          </button>
        </div>
      )}

      {/* Primary Nav */}
      <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} space-y-1 overflow-y-auto overflow-x-hidden`}>
        {visibleNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {/* Admin section */}
        {userRole === 'admin' && (
          <>
            <div className={`pt-6 pb-2 ${isCollapsed ? 'px-2' : 'px-4'}`}>
              {!isCollapsed && (
                <p className="text-[10px] text-outline uppercase tracking-widest font-semibold">
                  Admin
                </p>
              )}
              {isCollapsed && <div className="w-6 mx-auto border-t border-outline-variant/15" />}
            </div>
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-8 space-y-2`}>
        <Link
          href="/settings"
          title={isCollapsed ? 'Settings' : undefined}
          className={`flex items-center ${isCollapsed ? 'justify-center' : ''} gap-4 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-2xl`}
        >
          <span className="material-symbols-outlined text-xl shrink-0">settings</span>
          {!isCollapsed && <span>Settings</span>}
        </Link>

        <div className="pt-4 mt-2">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2`}>
            <div className="w-9 h-9 rounded-full bg-integrity flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            {!isCollapsed && (
              <>
                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-bold text-on-surface truncate">{userName}</p>
                  <p className="text-[11px] text-outline uppercase font-semibold tracking-wider">
                    {userRole.replace(/_/g, ' ')}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-outline hover:text-error transition-colors"
                  title="Sign out"
                >
                  <span className="material-symbols-outlined text-xl">logout</span>
                </button>
              </>
            )}
          </div>
          {isCollapsed && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center py-2 mt-1 text-outline hover:text-error transition-colors rounded-2xl hover:bg-surface-container-high"
              title="Sign out"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          )}
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-40 h-full hidden md:flex flex-col bg-surface-container-low shadow-[0px_4px_24px_rgba(77,85,106,0.08)] transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[72px]' : 'w-72'
        }`}
      >
        <SidebarContent isCollapsed={collapsed} />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm md:hidden"
          onClick={() => onMobileClose?.()}
        >
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 bg-surface-container-low flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent isCollapsed={false} />
          </aside>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 md:hidden flex justify-around items-center px-4 pb-safe pt-3 bg-white rounded-t-[32px] shadow-[0_-8px_24px_rgba(77,85,106,0.1)]">
        {visibleNav.slice(0, 4).map((item) => {
          const active = isActive(item.href)
          const iconColor = NAV_ICON_COLOR[item.href] ?? 'text-integrity'
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-full transition-all ${
                active
                  ? 'bg-integrity-10 text-on-surface'
                  : 'text-outline'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${active ? iconColor : ''}`}
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >{item.icon}</span>
              <span className="text-[9px] font-semibold uppercase tracking-widest">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
})
