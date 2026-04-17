'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { type Notification, NOTIFICATION_TYPE_META } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
  onUnreadCountChange?: (count: number) => void
}

type FilterTab = 'all' | 'unread' | 'archive'

export default function NotificationPanel({
  open,
  onClose,
  onUnreadCountChange,
}: NotificationPanelProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [unreadCount, setUnreadCount] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const readParam = activeTab === 'unread' ? '&read=false' : ''
      const res = await fetch(`/api/notifications?limit=30${readParam}`)
      if (!res.ok) return

      const data = await res.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unread_count)
      onUnreadCountChange?.(data.unread_count)
    } finally {
      setLoading(false)
    }
  }, [activeTab, onUnreadCountChange])

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  // Real-time subscription + fallback poll while panel is open
  useEffect(() => {
    if (!open) return

    const supabase = createClient()
    const channel = supabase
      .channel('notifications-panel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => fetchNotifications()
      )
      .subscribe()

    const interval = setInterval(fetchNotifications, 30000)
    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [open, fetchNotifications])

  // Close on escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((prev) => {
      const next = Math.max(0, prev - 1)
      onUnreadCountChange?.(next)
      return next
    })
  }

  async function markAllRead() {
    await fetch('/api/notifications/read-all', { method: 'POST' })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    onUnreadCountChange?.(0)
  }

  function handleNotificationClick(n: Notification) {
    if (!n.read) markAsRead(n.id)
    if (n.link) {
      router.push(n.link)
      onClose()
    }
  }

  function getRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString()
  }

  function getIconBgClass(type: string, read: boolean): string {
    if (read) return 'bg-surface-container'
    // Group 1: task events — primary-fixed
    if (type.startsWith('task_') || type === 'dependency_unblocked') return 'bg-primary-fixed'
    // Group 2: plan events — tertiary-fixed
    if (type.startsWith('plan_') || type.startsWith('checkin_') || type === 'zero_tasks_planned') return 'bg-tertiary-fixed'
    // Group 3: comments — secondary-fixed
    if (type.startsWith('comment_')) return 'bg-secondary-fixed'
    return 'bg-surface-container'
  }

  function getIconTextClass(type: string, read: boolean): string {
    if (read) return 'text-on-surface-variant'
    if (type.startsWith('task_') || type === 'dependency_unblocked') return 'text-on-primary-fixed'
    if (type.startsWith('plan_') || type.startsWith('checkin_') || type === 'zero_tasks_planned') return 'text-on-tertiary-fixed'
    if (type.startsWith('comment_')) return 'text-on-secondary-fixed'
    return 'text-on-surface-variant'
  }

  if (!open) return null

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 bg-primary/30 z-[55] backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-[400px] max-w-full z-[60] bg-surface-container-lowest shadow-[0px_0px_48px_rgba(77,85,106,0.10)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <header className="flex flex-col p-8 gap-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-on-surface">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="bg-primary-container text-on-primary-container text-xs font-bold px-2.5 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={markAllRead}
              className="text-sm font-medium text-primary hover:underline transition-all"
            >
              Mark all read
            </button>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex gap-2">
            {(['all', 'unread'] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={
                  activeTab === tab
                    ? 'bg-primary-container text-on-primary-container px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap'
                    : 'bg-surface-container-low text-on-surface-variant px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap hover:bg-surface-container-high transition-colors'
                }
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </header>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 flex flex-col gap-1">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface-container-low rounded-[24px] p-4 flex gap-4 animate-pulse"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-surface-container" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-container rounded-full w-3/4" />
                  <div className="h-3 bg-surface-container rounded-full w-full" />
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[48px] text-outline">
                  notifications_off
                </span>
              </div>
              <h3 className="text-xl font-bold text-on-surface">Nothing yet</h3>
              <p className="text-on-surface-variant text-sm max-w-xs">
                We&apos;ll let you know when something important happens in your Sunday dashboard.
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const meta = NOTIFICATION_TYPE_META[n.type]
              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`${
                    n.read
                      ? 'bg-surface-container-lowest hover:bg-surface-container-low'
                      : 'bg-surface-container-low hover:bg-surface-container-high'
                  } rounded-[24px] p-4 flex gap-4 relative group cursor-pointer transition-all`}
                >
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-9 h-9 rounded-full ${getIconBgClass(
                      n.type,
                      n.read
                    )} flex items-center justify-center`}
                  >
                    <span
                      className={`material-symbols-outlined text-[20px] ${getIconTextClass(
                        n.type,
                        n.read
                      )}`}
                    >
                      {meta?.icon ?? 'notifications'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <div className="flex justify-between items-start pr-4">
                      <p
                        className={`text-sm leading-tight ${
                          n.read
                            ? 'font-medium text-on-surface-variant'
                            : 'font-semibold text-on-surface'
                        }`}
                      >
                        {n.title}
                      </p>
                      <span className="text-[10px] font-medium text-outline uppercase tracking-wider whitespace-nowrap ml-2">
                        {getRelativeTime(n.created_at)}
                      </span>
                    </div>
                    <p
                      className={`text-sm line-clamp-2 ${
                        n.read ? 'text-outline' : 'text-on-surface-variant'
                      }`}
                    >
                      {n.message}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <footer className="p-6 bg-surface-container-low/50">
          <button
            onClick={() => {
              router.push('/settings/notifications')
              onClose()
            }}
            className="w-full py-4 rounded-full bg-gradient-to-br from-primary-container to-secondary text-white font-bold text-sm shadow-[0px_24px_48px_rgba(77,85,106,0.06)] hover:shadow-primary-container/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
            Notification Preferences
          </button>
        </footer>
      </aside>
    </>
  )
}
