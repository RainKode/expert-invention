'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Sidebar from '@/components/shell/Sidebar'
import TopBar from '@/components/shell/TopBar'
import { type Role } from '@/types'
import { invalidateCache } from '@/lib/fetch-cache'
import { createClient } from '@/lib/supabase/client'

// Lazy-load heavy modals — only downloaded when user opens them
const QuickTaskModal = dynamic(() => import('@/components/tasks/QuickTaskModal'), { ssr: false })
const NotificationPanel = dynamic(() => import('@/components/notifications/NotificationPanel'), { ssr: false })

interface AppShellClientProps {
  userName: string
  userRole: Role
  userId: string
  children: React.ReactNode
}

export default function AppShellClient({
  userName,
  userRole,
  userId,
  children,
}: AppShellClientProps) {
  const router = useRouter()
  const [quickTaskOpen, setQuickTaskOpen] = useState(false)
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Fetch initial unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=1')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.unread_count)
      }
    } catch {
      // Silently fail — non-critical
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()

    // Subscribe to real-time notification inserts for this user
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          // New notification arrived — refresh the count
          fetchUnreadCount()
        }
      )
      .subscribe()

    // Fallback poll every 60s in case realtime drops
    const interval = setInterval(fetchUnreadCount, 60000)
    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [fetchUnreadCount, userId])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const handleMobileClose = useCallback(() => setMobileMenuOpen(false), [])
  const handleNotificationClick = useCallback(() => setNotificationPanelOpen(true), [])
  const handleMenuOpen = useCallback(() => setMobileMenuOpen(true), [])
  const handleQuickTaskClose = useCallback(() => setQuickTaskOpen(false), [])
  const handleTaskCreated = useCallback(() => {
    invalidateCache('/api/tasks')
    router.refresh()
  }, [router])
  const handleNotificationClose = useCallback(() => setNotificationPanelOpen(false), [])
  const handleToggleSidebar = useCallback(() => setSidebarCollapsed(c => !c), [])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userName={userName} userRole={userRole} onLogout={handleLogout} mobileOpen={mobileMenuOpen} onMobileClose={handleMobileClose} collapsed={sidebarCollapsed} onToggleCollapse={handleToggleSidebar} />
      <TopBar
        userName={userName}
        userRole={userRole}
        unreadNotificationCount={unreadCount}
        onNotificationClick={handleNotificationClick}
        onMenuOpen={handleMenuOpen}
      />
      <main className={`mt-16 p-6 md:p-8 min-h-screen pb-24 md:pb-8 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-72'}`}>
        {children}
      </main>

      {/* Global floating New Task button */}
      <button
        onClick={() => setQuickTaskOpen(true)}
        title="New Task"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full text-white shadow-[0px_4px_20px_rgba(34,38,247,0.3)] flex items-center justify-center hover:scale-105 transition-transform md:hidden"
        style={{ background: 'linear-gradient(135deg, #2226F7 0%, #00D6A3 100%)' }}
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      <QuickTaskModal
        open={quickTaskOpen}
        onClose={handleQuickTaskClose}
        onCreated={handleTaskCreated}
        currentUserId={userId}
        userRole={userRole}
      />

      <NotificationPanel
        open={notificationPanelOpen}
        onClose={handleNotificationClose}
        onUnreadCountChange={setUnreadCount}
      />
    </div>
  )
}
