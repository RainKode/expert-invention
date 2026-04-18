'use client'
// ActivityClient — filter pills, event cards, cursor-based "load more"

import { useState, useTransition } from 'react'
import type { ActivityEvent, ActivityEventType, Role } from '@/types'

const FILTER_PILLS: { label: string; value: ActivityEventType | 'all' }[] = [
  { label: 'All Activity', value: 'all' },
  { label: 'Task Created', value: 'task_created' },
  { label: 'Status Changed', value: 'task_status_changed' },
  { label: 'Task Completed', value: 'task_completed' },
  { label: 'Plan Submitted', value: 'plan_submitted' },
  { label: 'Check-in', value: 'checkin_submitted' },
  { label: 'EOD Wrap-up', value: 'wrapup_submitted' },
  { label: 'Warning Ack.', value: 'warning_acknowledged' },
]

const EVENT_ICON: Record<ActivityEventType, string> = {
  task_created: 'add_task',
  task_status_changed: 'swap_horiz',
  task_assigned: 'person_add',
  task_reassigned: 'person_add',
  task_completed: 'task_alt',
  task_commented: 'chat',
  plan_submitted: 'calendar_view_week',
  plan_unlocked: 'lock_open',
  checkin_submitted: 'assignment_turned_in',
  wrapup_submitted: 'history_edu',
  field_updated: 'tune',
  user_joined: 'person',
  warning_acknowledged: 'warning',
}

const EVENT_COLOR: Record<ActivityEventType, string> = {
  task_created: 'bg-integrity-10 text-integrity',
  task_status_changed: 'bg-energetic-10 text-energetic',
  task_assigned: 'bg-integrity-10 text-integrity',
  task_reassigned: 'bg-energetic-10 text-energetic',
  task_completed: 'bg-kindness-10 text-kindness',
  task_commented: 'bg-originality-10 text-originality',
  plan_submitted: 'bg-natural-10 text-natural',
  plan_unlocked: 'bg-energetic-10 text-energetic',
  checkin_submitted: 'bg-natural-10 text-natural',
  wrapup_submitted: 'bg-natural-10 text-natural',
  field_updated: 'bg-surface-container text-on-surface-variant',
  user_joined: 'bg-integrity-10 text-integrity',
  warning_acknowledged: 'bg-excitement-10 text-excitement',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

function formatAbsolute(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

interface Props {
  initialEvents: ActivityEvent[]
  initialCursor: string | null
  userRole: Role
}

export default function ActivityClient({ initialEvents, initialCursor, userRole }: Props) {
  const [filter, setFilter] = useState<ActivityEventType | 'all'>('all')
  const [events, setEvents] = useState<ActivityEvent[]>(initialEvents)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [isPending, startTransition] = useTransition()
  const [hovered, setHovered] = useState<string | null>(null)

  const filtered = filter === 'all' ? events : events.filter(e => e.event_type === filter)

  function handleFilterChange(newFilter: ActivityEventType | 'all') {
    if (newFilter === filter) return
    setFilter(newFilter)
    // Reset to initial data + refetch with new filter from server
    startTransition(async () => {
      const params = new URLSearchParams({ limit: '20' })
      if (newFilter !== 'all') params.set('type', newFilter)
      const res = await fetch(`/api/activity-feed?${params}`)
      if (!res.ok) return
      const json = await res.json()
      setEvents(json.events ?? [])
      setCursor(json.next_cursor ?? null)
    })
  }

  function loadMore() {
    if (!cursor) return
    startTransition(async () => {
      const params = new URLSearchParams({ cursor, limit: '20' })
      if (filter !== 'all') params.set('type', filter)
      const res = await fetch(`/api/activity-feed?${params}`)
      if (!res.ok) return
      const json = await res.json()
      setEvents(prev => [...prev, ...(json.events ?? [])])
      setCursor(json.next_cursor ?? null)
    })
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-10 pt-4">
        <h1 className="text-[1.5rem] font-bold tracking-tight text-on-surface">Activity</h1>
        <p className="text-on-surface-variant font-medium mt-1">
          {userRole === 'employee' ? 'Your recent activity' : "Your team's activity"}
        </p>
      </div>

      {/* Filter Pills */}
      <section className="mb-10 overflow-x-auto">
        <div className="flex gap-3 pb-2">
          {FILTER_PILLS.map(pill => (
            <button
              key={pill.value}
              onClick={() => handleFilterChange(pill.value)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                filter === pill.value
                  ? 'bg-integrity text-white shadow-md'
                  : 'bg-white text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/15'
              }`}>
              {pill.label}
            </button>
          ))}
        </div>
      </section>

      {/* Event Timeline */}
      <section className="space-y-4 max-w-5xl relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[-24px] top-0 bottom-0 w-px bg-outline-variant/20" />

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-3 block opacity-30">history</span>
            <p className="text-sm font-medium">No activity to show for this filter.</p>
          </div>
        ) : filtered.map(event => {
          const icon = EVENT_ICON[event.event_type] ?? 'circle'
          const color = EVENT_COLOR[event.event_type] ?? 'bg-surface-container text-on-surface-variant'
          const isHovered = hovered === event.id
          const userName = event.user?.name ?? 'Someone'

          return (
            <div
              key={event.id}
              className="relative flex items-start gap-4 group"
              onMouseEnter={() => setHovered(event.id)}
              onMouseLeave={() => setHovered(null)}>
              {/* Timeline dot */}
              <div className="w-2 h-2 rounded-full bg-integrity absolute -left-[26px] top-6 group-hover:scale-125 transition-transform" />

              <div className={`flex-1 bg-white rounded-xl p-6 transition-shadow duration-300 ${
                isHovered ? 'shadow-[0px_24px_48px_rgba(77,85,106,0.12)]' : 'shadow-[0px_24px_48px_rgba(77,85,106,0.06)]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 bg-integrity text-white`}>
                      {userName.charAt(0)}
                      {/* Event type dot */}
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${color.split(' ')[0]}`}>
                        <span className={`material-symbols-outlined text-[10px] ${color.split(' ')[1]}`}
                          style={{ fontVariationSettings: "'FILL' 0, 'wght' 600, 'opsz' 20" }}>
                          {icon}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-on-surface text-sm leading-relaxed">
                        <span className="font-bold">{userName}</span>{' '}
                        {event.description.replace(userName, '').trim() || event.description}
                      </p>
                      {event.target_type && (
                        <p className="text-xs text-on-surface-variant/60 mt-1 uppercase tracking-wider font-bold">
                          {event.target_type}
                        </p>
                      )}
                    </div>
                  </div>
                  <time
                    title={formatAbsolute(event.created_at)}
                    className="text-sm text-on-surface-variant/50 shrink-0 ml-4">
                    {timeAgo(event.created_at)}
                  </time>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* Load earlier */}
      {cursor && (
        <div className="mt-10 flex justify-center max-w-5xl">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="px-8 py-3.5 rounded-full bg-white border border-outline-variant/20 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-all disabled:opacity-50 shadow-sm">
            {isPending ? 'Loading…' : 'Load earlier activity'}
          </button>
        </div>
      )}
    </div>
  )
}
