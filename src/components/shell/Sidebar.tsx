'use client'

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
}

export default function Sidebar({ userName, userRole, onLogout, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()

  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.requiredAction || can(userRole, item.requiredAction)
  )

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const NavLink = ({ item }: { item: NavItem }) => (
    <Link
      href={item.href}
      onClick={() => onMobileClose?.()}
      className={
        isActive(item.href)
          ? 'flex items-center gap-4 px-4 py-3 text-white font-semibold rounded-2xl shadow-ambient-sm transition-all'
          : 'flex items-center gap-4 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-2xl'
      }
      style={
        isActive(item.href)
          ? { background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }
          : undefined
      }
    >
      <span className="material-symbols-outlined text-xl">{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  )

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="px-8 pt-10 pb-12">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-ambient"
            style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
          >
            <span
              className="material-symbols-outlined text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              hub
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter text-primary">Sunday</h1>
            <p className="text-[10px] text-outline uppercase tracking-widest font-semibold">
              The Digital Atrium
            </p>
          </div>
        </div>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 px-4 space-y-1">
        {visibleNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {/* Admin section */}
        {userRole === 'admin' && (
          <>
            <div className="pt-6 pb-2 px-4">
              <p className="text-[10px] text-outline uppercase tracking-widest font-semibold">
                Admin
              </p>
            </div>
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-8 space-y-2">
        <Link
          href="/settings"
          className="flex items-center gap-4 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-2xl"
        >
          <span className="material-symbols-outlined text-xl">settings</span>
          <span>Settings</span>
        </Link>

        <div className="pt-4 mt-2">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center shrink-0">
              <span className="text-on-primary-container text-sm font-bold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
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
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 z-40 h-full w-72 hidden md:flex flex-col bg-surface-container-low shadow-ambient">
        <SidebarContent />
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
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 md:hidden flex justify-around items-center px-4 pb-safe pt-3 bg-surface-container-lowest rounded-t-[32px] shadow-[0_-8px_24px_rgba(77,85,106,0.08)]">
        {visibleNav.slice(0, 4).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-full transition-all ${
              isActive(item.href)
                ? 'bg-surface-container text-primary'
                : 'text-outline'
            }`}
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            <span className="text-[9px] font-semibold uppercase tracking-widest">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
