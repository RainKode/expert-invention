'use client'

import { useState, useEffect } from 'react'
import {
  type NotificationType,
  OPTIONAL_NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_META,
} from '@/types'

// Required notification types (all 13 minus the 3 optional)
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

// Description for each notification type
const NOTIFICATION_DESCRIPTIONS: Record<NotificationType, string> = {
  task_assigned: 'Notified when a task is assigned to you.',
  task_reassigned_away: 'Notified when a task is reassigned away from you.',
  task_due_today: 'Notified when a task is due today.',
  task_overdue: 'Urgent alert when a task passes its due date. Email sent to you and your manager.',
  task_in_review: 'Notified when a task is moved to review and you are the reviewer.',
  task_sent_back: 'Notified when a reviewer sends a task back to you.',
  task_marked_done: 'Notified when a task you created or are assigned to is marked as done.',
  dependency_unblocked: 'Notified when a blocking task is completed and your task can proceed.',
  plan_not_submitted: 'Urgent alert when a weekly plan is not submitted by the deadline.',
  checkin_not_submitted: 'Notified when your daily check-in has not been submitted.',
  zero_tasks_planned: 'Urgent alert when an employee has no tasks planned for the week.',
  comment_on_plan: 'Notified when someone comments on your weekly plan.',
  comment_on_task: 'Notified when someone comments on a task you are involved in.',
  task_carryover: 'Notified when a task is carried over to the next week.',
}

// Icons for optional types grouped by theme
const OPTIONAL_TYPE_ICONS: Partial<Record<NotificationType, { icon: string; bgClass: string }>> = {
  task_marked_done: { icon: 'task_alt', bgClass: 'bg-primary-container/10' },
  comment_on_plan: { icon: 'chat_bubble_outline', bgClass: 'bg-tertiary-container/10' },
  comment_on_task: { icon: 'comment', bgClass: 'bg-secondary-container/20' },
}

export default function NotificationPreferencesClient() {
  const [preferences, setPreferences] = useState<
    Record<NotificationType, boolean>
  >(() => {
    const defaults: Partial<Record<NotificationType, boolean>> = {}
    OPTIONAL_NOTIFICATION_TYPES.forEach((t) => {
      defaults[t] = true
    })
    return defaults as Record<NotificationType, boolean>
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [savedPrefs, setSavedPrefs] = useState<Record<NotificationType, boolean>>({} as Record<NotificationType, boolean>)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/notifications/preferences')
        if (!res.ok) return
        const data = await res.json()
        const prefs: Record<string, boolean> = {}
        data.preferences.forEach((p: { notification_type: string; enabled: boolean }) => {
          prefs[p.notification_type] = p.enabled
        })
        setPreferences(prefs as Record<NotificationType, boolean>)
        setSavedPrefs(prefs as Record<NotificationType, boolean>)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function togglePreference(type: NotificationType) {
    setPreferences((prev) => {
      const updated = { ...prev, [type]: !prev[type] }
      setDirty(
        OPTIONAL_NOTIFICATION_TYPES.some((t) => updated[t] !== savedPrefs[t])
      )
      return updated
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const body = {
        preferences: OPTIONAL_NOTIFICATION_TYPES.map((type) => ({
          notification_type: type,
          enabled: preferences[type] ?? true,
        })),
      }
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setSavedPrefs({ ...preferences })
        setDirty(false)
      }
    } finally {
      setSaving(false)
    }
  }

  function handleDiscard() {
    setPreferences({ ...savedPrefs })
    setDirty(false)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">
          Notification Preferences
        </h1>
        <p className="text-on-surface-variant font-medium">
          Manage which notifications you receive
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-2">
          <nav className="flex flex-col gap-1">
            <span className="flex items-center gap-3 px-5 py-3 rounded-xl bg-surface-container-highest text-on-surface transition-all">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                notifications
              </span>
              <span className="font-bold text-sm">Notification Preferences</span>
            </span>
          </nav>
        </aside>

        {/* Settings Content */}
        <section className="lg:col-span-9 space-y-10">
          {/* Required Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <span className="material-symbols-outlined text-tertiary">lock</span>
              <h2 className="text-lg font-bold tracking-tight text-on-surface">
                Required Notifications
              </h2>
            </div>
            <div className="grid gap-3">
              {REQUIRED_NOTIFICATION_TYPES.map((type) => {
                const meta = NOTIFICATION_TYPE_META[type]
                return (
                  <div
                    key={type}
                    className="flex items-center justify-between p-6 bg-white rounded-[24px] shadow-[0px_8px_24px_rgba(77,85,106,0.03)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant">
                          {meta.icon}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface">{meta.label}</h3>
                        <p className="text-sm text-on-surface-variant">
                          {NOTIFICATION_DESCRIPTIONS[type]}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-bold uppercase tracking-widest rounded-full">
                      Required
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Optional Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <span className="material-symbols-outlined text-tertiary">
                settings_suggest
              </span>
              <h2 className="text-lg font-bold tracking-tight text-on-surface">
                Optional Notifications
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {OPTIONAL_NOTIFICATION_TYPES.map((type, idx) => {
                const meta = NOTIFICATION_TYPE_META[type]
                const optMeta = OPTIONAL_TYPE_ICONS[type]
                const isEnabled = preferences[type] ?? true
                const isWide = idx === OPTIONAL_NOTIFICATION_TYPES.length - 1 && OPTIONAL_NOTIFICATION_TYPES.length % 2 !== 0

                return (
                  <div
                    key={type}
                    className={`${
                      isWide ? 'md:col-span-2' : ''
                    } p-6 bg-white rounded-[24px] shadow-[0px_24px_48px_rgba(77,85,106,0.06)] flex ${
                      isWide ? 'items-center justify-between' : 'flex-col justify-between'
                    } group hover:shadow-xl transition-shadow`}
                  >
                    <div className={`flex ${isWide ? 'items-center gap-6' : 'justify-between items-start mb-4'}`}>
                      {!isWide && (
                        <>
                          <div
                            className={`w-12 h-12 rounded-2xl ${
                              optMeta?.bgClass ?? 'bg-surface-container'
                            } flex items-center justify-center group-hover:scale-110 transition-transform`}
                          >
                            <span className="material-symbols-outlined text-primary-container">
                              {meta.icon}
                            </span>
                          </div>
                          <ToggleSwitch
                            enabled={isEnabled}
                            onChange={() => togglePreference(type)}
                            loading={loading || saving}
                          />
                        </>
                      )}
                      {isWide && (
                        <div className="flex items-center gap-6">
                          <div
                            className={`w-12 h-12 rounded-2xl ${
                              optMeta?.bgClass ?? 'bg-surface-container'
                            } flex items-center justify-center group-hover:rotate-12 transition-transform`}
                          >
                            <span className="material-symbols-outlined text-secondary">
                              {meta.icon}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-on-surface mb-1">{meta.label}</h3>
                            <p className="text-sm text-on-surface-variant max-w-md">
                              {NOTIFICATION_DESCRIPTIONS[type]}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    {!isWide && (
                      <div>
                        <h3 className="font-bold text-on-surface mb-1">{meta.label}</h3>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                          {NOTIFICATION_DESCRIPTIONS[type]}
                        </p>
                      </div>
                    )}
                    {isWide && (
                      <ToggleSwitch
                        enabled={isEnabled}
                        onChange={() => togglePreference(type)}
                        loading={loading || saving}
                        large
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action Footer */}
          {dirty && (
            <footer className="pt-8 flex items-center justify-end gap-4">
              <button
                onClick={handleDiscard}
                className="px-8 py-3 rounded-full text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-all"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-10 py-3 rounded-full text-sm font-bold text-white bg-integrity shadow-[0px_24px_48px_rgba(77,85,106,0.06)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </footer>
          )}
        </section>
      </div>
    </div>
  )
}

// Toggle switch component
function ToggleSwitch({
  enabled,
  onChange,
  loading,
  large,
}: {
  enabled: boolean
  onChange: () => void
  loading?: boolean
  large?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      disabled={loading}
      className={`${large ? 'w-14 h-7' : 'w-11 h-6'} relative inline-flex items-center rounded-full transition-colors ${
        enabled ? 'bg-primary-container' : 'bg-surface-container'
      } ${loading ? 'opacity-50' : ''}`}
    >
      <span
        className={`${
          large ? 'h-5 w-5' : 'h-5 w-5'
        } inline-block rounded-full bg-white shadow-sm transition-transform ${
          enabled
            ? large
              ? 'translate-x-[30px]'
              : 'translate-x-[22px]'
            : 'translate-x-[2px]'
        }`}
      />
    </button>
  )
}
