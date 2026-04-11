'use client'

import { useRouter } from 'next/navigation'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatWeekRange(weekStartISO: string) {
  const start = new Date(weekStartISO + 'T00:00:00')
  const end = new Date(start)
  end.setDate(start.getDate() + 4)
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}, ${start.getFullYear()}`
}

function prevMonday(weekStartISO: string) {
  const d = new Date(weekStartISO + 'T00:00:00')
  d.setDate(d.getDate() - 7)
  return d.toISOString().split('T')[0]
}

function nextMonday(weekStartISO: string) {
  const d = new Date(weekStartISO + 'T00:00:00')
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

function getDayDate(weekStartISO: string, dow: number): Date {
  const start = new Date(weekStartISO + 'T00:00:00')
  const dayDate = new Date(start)
  // weekStart is Monday (dow=1), offset to target dow
  dayDate.setDate(start.getDate() + (dow - 1))
  return dayDate
}

function cellStyle(hours: number, available: number) {
  if (hours === 0) return { bg: 'bg-surface-container-lowest', label: '', text: 'text-outline' }
  const pct = (hours / available) * 100
  if (pct >= 80 && pct <= 100) return { bg: 'bg-primary-container/20', label: 'Healthy', text: 'text-primary' }
  if (pct > 100) return { bg: 'bg-error-container', label: 'Over', text: 'text-error' }
  if (pct >= 50) return { bg: 'bg-tertiary-container/40', label: 'Low', text: 'text-tertiary' }
  return { bg: 'bg-surface-container-lowest', label: 'Empty', text: 'text-outline' }
}

const STATUS_BADGE: Record<string, string> = {
  submitted: 'bg-primary-container/20 text-primary',
  fluid: 'bg-secondary-container text-on-secondary-container',
  draft: 'bg-tertiary-container text-on-tertiary-container',
}

interface MemberSummary {
  user: { id: string; name: string; available_hours: number; work_week: number[] }
  plan: { id: string; submission_status: string; locked: boolean } | null
  day_hours: Record<number, number>
  submission_status: string
  unplanned_days: number[]
}

interface Props {
  members: MemberSummary[]
  weekStartISO: string
  teamName: string
}

export default function TeamPlansClient({ members, weekStartISO, teamName }: Props) {
  const router = useRouter()

  // Collect all working days across team (union of work_week values Mon-Fri)
  const allDays = Array.from(
    new Set(members.flatMap((m) => m.user.work_week.filter((d) => d >= 1 && d <= 5)))
  ).sort()

  const displayDays = allDays.length > 0 ? allDays : [1, 2, 3, 4, 5]

  // Members with unplanned days
  const membersWithIssues = members.filter((m) => m.unplanned_days.length > 0)

  // Overall completion %
  const totalMembers = members.length
  const submittedCount = members.filter((m) => m.submission_status === 'submitted').length
  const completionPct = totalMembers > 0 ? Math.round((submittedCount / totalMembers) * 100) : 0

  return (
    <div className="px-12 py-8 flex flex-col gap-10 min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-on-surface">Team Plans</h2>
          <p className="text-[#434655] font-medium text-sm mt-1">
            {teamName} — week of {formatWeekRange(weekStartISO)}
          </p>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-full shadow-sm">
          <button
            onClick={() => router.push(`/team/plans?week=${prevMonday(weekStartISO)}`)}
            className="material-symbols-outlined text-sm hover:text-[#4d556a] transition-colors"
          >
            chevron_left
          </button>
          <span className="text-sm font-semibold tracking-tight">{formatWeekRange(weekStartISO)}</span>
          <button
            onClick={() => router.push(`/team/plans?week=${nextMonday(weekStartISO)}`)}
            className="material-symbols-outlined text-sm hover:text-[#4d556a] transition-colors"
          >
            chevron_right
          </button>
        </div>
      </div>

      {/* Big Fat Warning Banner */}
      {membersWithIssues.length > 0 && (
        <div className="bg-error-container/10 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl shadow-[#4d556a]/5">
          <div className="flex items-center gap-3 text-error">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
            <span className="font-bold tracking-tight uppercase">
              ATTENTION: {membersWithIssues.length} TEAM MEMBER{membersWithIssues.length > 1 ? 'S HAVE' : ' HAS'} UNPLANNED DAYS
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {membersWithIssues.map((m) => (
              <div
                key={m.user.id}
                className="bg-surface-container-lowest p-4 rounded-2xl flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-[#4d556a] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {m.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{m.user.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {m.unplanned_days.map((d) => (
                      <span
                        key={d}
                        className="px-2 py-0.5 bg-error-container text-on-error-container text-[10px] font-bold rounded-full uppercase"
                      >
                        {DAY_NAMES[d]}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/plan?user=${m.user.id}`)}
                  className="text-[#4d556a] hover:bg-surface-container-high p-2 rounded-full transition-colors shrink-0"
                  title="View plan"
                >
                  <span className="material-symbols-outlined">edit_calendar</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Capacity Grid */}
      {members.length === 0 ? (
        <div className="bg-surface-container-low rounded-2xl p-12 text-center text-outline">
          No team members found for this period.
        </div>
      ) : (
        <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-2xl shadow-[#4d556a]/5">
          {/* Grid Header */}
          <div
            className="grid"
            style={{ gridTemplateColumns: `1fr repeat(${displayDays.length}, 1fr) auto` }}
          >
            <div className="p-6 text-[10px] font-bold uppercase tracking-widest text-outline">
              Team Member
            </div>
            {displayDays.map((dow) => {
              const dayDate = getDayDate(weekStartISO, dow)
              return (
                <div key={dow} className="p-6 text-[10px] font-bold uppercase tracking-widest text-outline text-center">
                  {DAY_NAMES[dow]} ({dayDate.getDate().toString().padStart(2, '0')})
                </div>
              )
            })}
            <div className="p-6 text-[10px] font-bold uppercase tracking-widest text-outline text-center">
              Status
            </div>
          </div>

          {/* Rows */}
          {members.map((member) => (
            <div
              key={member.user.id}
              className="grid last:border-0"
              style={{ gridTemplateColumns: `1fr repeat(${displayDays.length}, 1fr) auto` }}
            >
              {/* Name */}
              <div className="p-6 bg-surface-container-lowest flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#4d556a] flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {member.user.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-sm truncate">{member.user.name}</span>
              </div>

              {/* Day Cells */}
              {displayDays.map((dow) => {
                const hours = member.day_hours[dow] ?? 0
                const available = member.user.available_hours
                const style = cellStyle(hours, available)
                const isWorkingDay = member.user.work_week.includes(dow)

                if (!isWorkingDay) {
                  return (
                    <div key={dow} className="p-6 bg-surface-container-highest/30 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Off</span>
                    </div>
                  )
                }

                return (
                  <div key={dow} className={`p-6 ${style.bg} flex flex-col items-center justify-center`}>
                    {style.label && (
                      <span className={`${style.text} font-bold text-[10px] uppercase mb-1`}>
                        {style.label}
                      </span>
                    )}
                    <span className={`font-bold text-sm ${style.text}`}>
                      {hours} / {available} hrs
                    </span>
                  </div>
                )
              })}

              {/* Status Badge */}
              <div className="p-6 bg-surface-container-lowest flex items-center justify-center">
                <span
                  className={`px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full ${STATUS_BADGE[member.submission_status] ?? STATUS_BADGE.draft}`}
                >
                  {member.submission_status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completion Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-2xl shadow-[#4d556a]/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-outline text-[10px] font-bold uppercase tracking-widest">
                Plan Submission
              </span>
              <p className="text-xl font-bold">{teamName} Overall</p>
            </div>
            <span className="text-2xl font-black text-[#4d556a]">{completionPct}%</span>
          </div>
          <div className="h-3 w-full bg-surface-container-low rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${completionPct}%`,
                background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)',
              }}
            />
          </div>
          <p className="mt-4 text-xs text-[#434655] font-medium leading-relaxed">
            {submittedCount} of {totalMembers} team members have submitted their plan for this week.
          </p>
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-2xl shadow-[#4d556a]/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-outline text-[10px] font-bold uppercase tracking-widest">
                Unplanned Members
              </span>
              <p className="text-xl font-bold">Attention Needed</p>
            </div>
            <span className="text-2xl font-black text-error">{membersWithIssues.length}</span>
          </div>
          <div className="h-3 w-full bg-surface-container-low rounded-full overflow-hidden">
            <div
              className="h-full bg-error rounded-full"
              style={{
                width: `${totalMembers > 0 ? (membersWithIssues.length / totalMembers) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="mt-4 text-xs text-[#434655] font-medium leading-relaxed">
            {membersWithIssues.length === 0
              ? 'All team members have tasks planned for every working day this week.'
              : `${membersWithIssues.length} member(s) have at least one working day with no planned tasks.`}
          </p>
        </div>
      </div>
    </div>
  )
}
