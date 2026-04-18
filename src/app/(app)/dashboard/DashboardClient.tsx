'use client'
// DashboardClient — My Overview personal dashboard
// 4-widget layout matching design: Today's Tasks | Weekly Completion Rate + Upcoming Deadlines + Carry-overs + Team Sentiment bento

import Link from 'next/link'
import { can } from '@/lib/permissions'
import type { MyOverviewData, Role, TaskPriority, TaskStatus } from '@/types'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`
}

function todayLabel() {
  const d = new Date()
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

const PRIORITY_DOT: Record<TaskPriority, string> = {
  high: 'bg-excitement',
  medium: 'bg-energetic',
  low: 'bg-outline',
}

const STATUS_LABEL: Record<TaskStatus, { label: string; cls: string }> = {
  todo: { label: 'To Do', cls: 'bg-surface-container-high text-on-surface-variant' },
  in_progress: { label: 'In Progress', cls: 'bg-energetic-10 text-energetic' },
  in_review: { label: 'In Review', cls: 'bg-integrity-10 text-integrity' },
  done: { label: 'Done', cls: 'bg-kindness-10 text-kindness' },
}

interface Props {
  data: MyOverviewData
  role: string
}

export default function DashboardClient({ data, role }: Props) {
  const isManager = can(role as Role, 'view_team_tasks')
  // Donut chart maths
  const circumference = 2 * Math.PI * 40  // r=40
  const dashOffset = circumference - (data.completion_rate / 100) * circumference

  return (
    <div>
      {/* Page Header */}
      <div className="mb-12 pt-4">
        <h1 className="text-[2rem] md:text-[2.5rem] font-extrabold tracking-tight text-on-surface">
          Good morning, {data.greeting_name}.
        </h1>
        <p className="text-on-surface-variant font-medium mt-1">{todayLabel()}.</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-white rounded-2xl p-5 shadow-[0px_2px_12px_rgba(34,38,247,0.08)] border border-integrity/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-xl bg-integrity-10 flex items-center justify-center">
              <span className="material-symbols-outlined text-integrity text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
            </span>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Done</span>
          </div>
          <p className="text-2xl font-extrabold text-integrity">{data.completed_this_week}</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">this week</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-[0px_2px_12px_rgba(254,94,32,0.08)] border border-energetic/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-xl bg-energetic-10 flex items-center justify-center">
              <span className="material-symbols-outlined text-energetic text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>pending_actions</span>
            </span>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">In Progress</span>
          </div>
          <p className="text-2xl font-extrabold text-energetic">{data.today_tasks.filter(t => t.status === 'in_progress').length}</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">active today</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-[0px_2px_12px_rgba(247,34,38,0.08)] border border-excitement/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-xl bg-excitement-10 flex items-center justify-center">
              <span className="material-symbols-outlined text-excitement text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </span>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Overdue</span>
          </div>
          <p className="text-2xl font-extrabold text-excitement">{data.overdue_tasks.length}</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">need attention</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-[0px_2px_12px_rgba(0,214,163,0.08)] border border-kindness/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-xl bg-kindness-10 flex items-center justify-center">
              <span className="material-symbols-outlined text-kindness text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>speed</span>
            </span>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Rate</span>
          </div>
          <p className="text-2xl font-extrabold text-kindness">{data.completion_rate}%</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">completion</p>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* ── Today's Tasks (7 cols, taller) ─────────────────────────────── */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 md:p-8 shadow-[0px_4px_24px_rgba(77,85,106,0.08)] min-h-[400px] lg:min-h-[520px]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold tracking-tight">Today&apos;s Tasks</h2>
            <Link href="/tasks" className="text-primary-container hover:underline font-semibold text-sm">
              View all
            </Link>
          </div>

          {data.overdue_tasks.length > 0 && (
            <div className="mb-4 px-3 py-2 bg-excitement-10 rounded-xl flex items-center gap-2 text-excitement text-xs font-bold">
              <span className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              {data.overdue_tasks.length} overdue task{data.overdue_tasks.length > 1 ? 's' : ''}
            </div>
          )}

          <div className="flex flex-col gap-4">
            {data.overdue_tasks.map(t => (
              <Link key={t.id} href={`/tasks/${t.id}`}
                className="group flex items-center gap-4 p-4 hover:bg-surface-container-low rounded-xl transition-all duration-300">
                <div className="w-2 h-2 rounded-full bg-excitement shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-on-surface truncate">{t.title}</h3>
                  {t.project_name && <p className="text-sm text-on-surface-variant">{t.project_name}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="bg-excitement-10 text-excitement text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    Overdue
                  </span>
                  <span className="text-sm font-medium text-on-surface-variant">{formatDate(t.due_date!)}</span>
                </div>
              </Link>
            ))}

            {data.today_tasks.map(t => (
              <Link key={t.id} href={`/tasks/${t.id}`}
                className="group flex items-center gap-4 p-4 hover:bg-surface-container-low rounded-xl transition-all duration-300">
                <div className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[t.priority]}`} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-on-surface truncate">{t.title}</h3>
                  {t.project_name && <p className="text-sm text-on-surface-variant">{t.project_name}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${STATUS_LABEL[t.status].cls}`}>
                    {STATUS_LABEL[t.status].label}
                  </span>
                  {t.estimated_hours && (
                    <span className="text-sm font-medium text-on-surface-variant">{t.estimated_hours}h</span>
                  )}
                </div>
              </Link>
            ))}

            {data.today_tasks.length === 0 && data.overdue_tasks.length === 0 && (
              <div className="text-center py-12 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-3 block text-outline"
                  style={{ fontVariationSettings: "'FILL' 0" }}>task_alt</span>
                <p className="font-medium">All caught up — no tasks due today.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column ────────────────────────────────────────────────── */}
        <div className="lg:col-span-5 flex flex-col gap-8">

          {/* Weekly Completion Rate */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0px_4px_24px_rgba(77,85,106,0.08)]">
            <h2 className="text-lg font-bold tracking-tight mb-6">Weekly Completion Rate</h2>
            <div className="flex items-center gap-6 md:gap-8">
              {/* Donut */}
              <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor"
                    strokeWidth="12" className="text-surface-container-high" />
                  <circle cx="50" cy="50" r="40" fill="transparent"
                    stroke="url(#grad)" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2226F7" />
                      <stop offset="50%" stopColor="#00D6A3" />
                      <stop offset="100%" stopColor="#24D56D" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-integrity">{data.completion_rate}%</span>
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-on-surface">{data.completed_this_week}</p>
                <p className="text-sm text-on-surface-variant font-medium">tasks done this week</p>
                <p className="text-xs text-on-surface-variant mt-1 opacity-70">
                  of {data.total_committed_this_week} committed
                </p>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0px_4px_24px_rgba(77,85,106,0.08)]">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-8 h-8 rounded-xl bg-energetic-10 flex items-center justify-center">
                <span className="material-symbols-outlined text-energetic text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>event_upcoming</span>
              </span>
              <h2 className="text-lg font-bold tracking-tight">Upcoming Deadlines</h2>
            </div>
            {data.upcoming_deadlines.length === 0 ? (
              <p className="text-on-surface-variant text-sm">No deadlines in the next 3 days.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {data.upcoming_deadlines.map(d => {
                  const dt = new Date(d.due_date)
                  return (
                    <Link key={d.id} href={`/tasks/${d.id}`}
                      className="flex items-center gap-4 hover:bg-surface-container-low p-1 rounded-xl transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-energetic-10 flex items-center justify-center text-energetic font-bold text-[10px] text-center leading-tight shrink-0">
                        {MONTH_NAMES[dt.getMonth()]}<br />{dt.getDate()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-on-surface truncate">{d.title}</h4>
                        {d.project_name && <p className="text-xs text-on-surface-variant">{d.project_name}</p>}
                      </div>
                      <span className="text-xs font-bold text-on-surface-variant shrink-0">
                        {d.days_until === 1 ? 'Tomorrow' : `${d.days_until} days`}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Carry-overs (bottom, 7 cols) ────────────────────────────────── */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 md:p-8 shadow-[0px_4px_24px_rgba(77,85,106,0.08)]">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-8 h-8 rounded-xl bg-happiness-10 flex items-center justify-center">
              <span className="material-symbols-outlined text-happiness text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
            </span>
            <h2 className="text-lg font-bold tracking-tight">Carry-overs</h2>
          </div>
          {data.carry_overs.length === 0 ? (
            <p className="text-on-surface-variant text-sm">No carry-overs this week.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {data.carry_overs.map(c => (
                <Link key={c.id} href={`/tasks/${c.id}`}
                  className="flex items-center gap-4 p-3 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-happiness"
                    style={{ fontVariationSettings: "'FILL' 0" }}>history</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-on-surface truncate">{c.title}</h4>
                    <p className="text-xs text-on-surface-variant">From {formatDate(c.original_date)}</p>
                  </div>
                  <span className="bg-[#d0c3ba] text-[#453d36] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shrink-0">
                    Carried over
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Manager quick-links bento (bottom, 5 cols) ──────────────────── */}
        {isManager ? (
          <div className="lg:col-span-5 bg-gradient-to-br from-[#2226F7] to-[#00D6A3] rounded-2xl p-6 md:p-8 shadow-[0px_8px_32px_rgba(34,38,247,0.15)] text-white">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-lg font-bold">Manager Views</h2>
              <span className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 0" }}>manage_accounts</span>
            </div>
            <p className="text-sm opacity-80 mb-6">Quickly access your team&apos;s planning and capacity data.</p>
            <div className="flex flex-col gap-3">
              <Link href="/dashboard/team-pulse"
                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 transition-colors text-sm font-semibold">
                <span className="material-symbols-outlined text-base"
                  style={{ fontVariationSettings: "'FILL' 0" }}>groups</span>
                Team Pulse
              </Link>
              <Link href="/dashboard/workload"
                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 transition-colors text-sm font-semibold">
                <span className="material-symbols-outlined text-base"
                  style={{ fontVariationSettings: "'FILL' 0" }}>bar_chart</span>
                Workload View
              </Link>
              <Link href="/dashboard/activity"
                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 transition-colors text-sm font-semibold">
                <span className="material-symbols-outlined text-base"
                  style={{ fontVariationSettings: "'FILL' 0" }}>history</span>
                Activity Feed
              </Link>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-5 bg-gradient-to-br from-[#2226F7] to-[#FF3797] rounded-2xl p-6 md:p-8 shadow-[0px_8px_32px_rgba(34,38,247,0.15)] text-white">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold">Your Week</h2>
              <span className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 0" }}>calendar_view_week</span>
            </div>
            <p className="text-3xl font-light mb-2">
              {data.completion_rate >= 80 ? 'On Track' : data.completion_rate >= 50 ? 'Getting There' : 'Needs Focus'}
            </p>
            <p className="text-sm opacity-80 mb-6">
              {data.completed_this_week} of {data.total_committed_this_week} tasks done this week.
            </p>
            <Link href="/plan"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 text-sm font-semibold transition-colors">
              <span className="material-symbols-outlined text-base"
                style={{ fontVariationSettings: "'FILL' 0" }}>edit_calendar</span>
              Open My Plan
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
