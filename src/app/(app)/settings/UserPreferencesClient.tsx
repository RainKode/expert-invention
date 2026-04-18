'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  type NotificationType,
  OPTIONAL_NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_META,
} from '@/types'

const REQUIRED_NOTIFICATION_TYPES: NotificationType[] = [
  'task_assigned',
  'task_reassigned_away',
  'task_due_today',
  'task_overdue',
  'task_in_review',
  'task_sent_back',
  'dependency_unblocked',
  'plan_not_submitted',
  'checkin_not_submitted',
  'zero_tasks_planned',
]

const NOTIFICATION_DESCRIPTIONS: Record<string, string> = {
  task_assigned: 'Notified when a task is assigned to you.',
  task_reassigned_away: 'Notified when a task is reassigned away from you.',
  task_due_today: 'Notified when a task is due today.',
  task_overdue: 'Urgent alert when a task passes its due date.',
  task_in_review: 'Notified when a task is moved to review.',
  task_sent_back: 'Notified when a reviewer sends a task back.',
  task_marked_done: 'Notified when a task is marked as done.',
  dependency_unblocked: 'Your task can now proceed.',
  plan_not_submitted: 'Weekly plan not submitted by deadline.',
  checkin_not_submitted: 'Daily check-in has not been submitted.',
  zero_tasks_planned: 'No tasks planned for the week.',
  comment_on_plan: 'Someone comments on your weekly plan.',
  comment_on_task: 'Someone comments on your task.',
}

export default function UserPreferencesClient() {
  const [notifPrefs, setNotifPrefs] = useState<Record<NotificationType, boolean>>({} as Record<NotificationType, boolean>)
  const [defaultView, setDefaultView] = useState<'list' | 'kanban'>('list')
  const [loading, setLoading] = useState(true)
  const [savingNotif, setSavingNotif] = useState(false)
  const [savingView, setSavingView] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [notifRes, prefsRes] = await Promise.all([
      fetch('/api/notifications/preferences'),
      fetch('/api/settings/user-preferences'),
    ])
    if (notifRes.ok) {
      const data = await notifRes.json()
      const prefs: Record<string, boolean> = {}
      data.preferences.forEach((p: { notification_type: string; enabled: boolean }) => {
        prefs[p.notification_type] = p.enabled
      })
      setNotifPrefs(prefs as Record<NotificationType, boolean>)
    }
    if (prefsRes.ok) {
      const data = await prefsRes.json()
      setDefaultView(data.default_task_view ?? 'list')
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const notifDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestPrefs = useRef(notifPrefs)
  latestPrefs.current = notifPrefs

  async function toggleNotif(type: NotificationType) {
    const updated = { ...notifPrefs, [type]: !notifPrefs[type] }
    setNotifPrefs(updated)
    latestPrefs.current = updated

    // Debounce: wait 600ms before saving to batch rapid toggles
    if (notifDebounce.current) clearTimeout(notifDebounce.current)
    notifDebounce.current = setTimeout(async () => {
      setSavingNotif(true)
      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: OPTIONAL_NOTIFICATION_TYPES.map((t) => ({
            notification_type: t,
            enabled: latestPrefs.current[t] ?? true,
          })),
        }),
      })
      setSavingNotif(false)
    }, 600)
  }

  async function changeView(view: 'list' | 'kanban') {
    setDefaultView(view)
    setSavingView(true)
    await fetch('/api/settings/user-preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ default_task_view: view }),
    })
    setSavingView(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-integrity border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <header className="mb-12">
        <h1 className="text-[1.5rem] font-bold tracking-tight text-on-surface mb-2">User Preferences</h1>
        <p className="text-on-surface-variant text-sm">Manage your personal notifications, workspace views, and default settings.</p>
      </header>

      <div className="space-y-12">
        {/* Notification Preferences */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#453d36]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notification Preferences
            {savingNotif && <span className="text-xs text-on-surface-variant font-normal ml-2">Saving…</span>}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Required */}
            <div className="bg-[#f2f4f6] p-6 rounded-2xl">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Core System Alerts</h3>
              <ul className="space-y-4">
                {REQUIRED_NOTIFICATION_TYPES.map((type) => (
                  <li key={type} className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-[#565e74] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">
                        {NOTIFICATION_TYPE_META[type]?.label ?? type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-on-surface-variant">{NOTIFICATION_DESCRIPTIONS[type]}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Optional toggles */}
            <div className="space-y-4">
              {OPTIONAL_NOTIFICATION_TYPES.map((type) => (
                <div key={type} className="flex items-center justify-between p-4 bg-[#f7f9fb] rounded-2xl hover:shadow-[0px_4px_12px_rgba(77,85,106,0.04)] transition-all">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">
                      {NOTIFICATION_TYPE_META[type]?.label ?? type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-on-surface-variant">{NOTIFICATION_DESCRIPTIONS[type]}</p>
                  </div>
                  <button
                    onClick={() => toggleNotif(type)}
                    className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors ${
                      notifPrefs[type] ? 'bg-integrity' : 'bg-[#e0e3e5]'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                      notifPrefs[type] ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Default Task View */}
        <section>
          <h2 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#453d36]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Default Task View
            {savingView && <span className="text-xs text-on-surface-variant font-normal ml-2">Saving…</span>}
          </h2>
          <div className="inline-flex p-1.5 bg-[#eceef0] rounded-full">
            <button
              onClick={() => changeView('list')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                defaultView === 'list'
                  ? 'bg-white shadow-sm text-[#363e52]'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List View
            </button>
            <button
              onClick={() => changeView('kanban')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                defaultView === 'kanban'
                  ? 'bg-white shadow-sm text-[#363e52]'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Kanban Board
            </button>
          </div>
          <p className="mt-4 text-xs text-on-surface-variant italic">
            This view will be applied globally across all your project workspaces.
          </p>
        </section>
      </div>
    </>
  )
}
