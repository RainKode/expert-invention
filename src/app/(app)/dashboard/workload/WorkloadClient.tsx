'use client'
// WorkloadClient — planned vs actual hours grid per member per day

import { useRouter } from 'next/navigation'
import type { WorkloadData } from '@/types'

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(dayOfWeek: number, weekStart: string) {
  const monday = new Date(weekStart)
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const d = new Date(monday)
  d.setDate(monday.getDate() + diff)
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`
}

function prevWeek(weekStart: string) {
  const d = new Date(weekStart)
  d.setDate(d.getDate() - 7)
  return d.toISOString().split('T')[0]
}

function nextWeek(weekStart: string) {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

function cellStyle(utilisation_pct: number, planned_hours: number): string {
  if (planned_hours === 0) return 'bg-surface-container text-on-surface-variant/40'
  if (utilisation_pct >= 90) return 'bg-natural-10 text-natural'
  if (utilisation_pct >= 60) return 'bg-energetic-10 text-energetic'
  return 'bg-excitement-10 text-excitement'
}

function varianceBadge(variance: number) {
  if (variance > 0.5) return { cls: 'bg-energetic-10 text-energetic', label: `+${variance}h` }
  if (variance < -0.5) return { cls: 'bg-excitement-10 text-excitement', label: `${variance}h` }
  return { cls: 'bg-natural-10 text-natural', label: 'On Track' }
}

function dateFromDow(dow: number, weekStart: string): string {
  const monday = new Date(weekStart)
  const diff = dow === 0 ? 6 : dow - 1
  const d = new Date(monday)
  d.setDate(monday.getDate() + diff)
  return d.toISOString().split('T')[0]
}

interface Props {
  data: WorkloadData
  weekStart: string
  workingDays: number[]
}

export default function WorkloadClient({ data, weekStart, workingDays }: Props) {
  const router = useRouter()
  const todayDow = new Date().getDay()

  const avgVariance = data.members.length > 0
    ? Math.round((data.members.reduce((s, m) => s + m.weekly_variance_hours, 0) / data.members.length) * 10) / 10
    : 0

  const bottlenecks = data.members.filter(m => m.weekly_variance_hours < -1).length
  const varBadge = varianceBadge(avgVariance)

  return (
    <div>
      {/* Page Header */}
      <div className="mb-10 pt-4 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[1.5rem] font-bold tracking-tight text-on-surface">Workload</h1>
          <p className="text-on-surface-variant font-medium mt-1">Planned vs Actual — week of {weekStart}</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {/* Legend */}
          <div className="flex gap-3 text-xs font-bold text-on-surface-variant">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-natural" /> ≥90%</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-energetic" /> 60–89%</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-excitement" /> &lt;60%</span>
          </div>
          {/* Week nav */}
          <div className="flex items-center gap-2 bg-surface-container-lowest rounded-full px-4 py-2 shadow-sm">
            <button onClick={() => router.push(`/dashboard/workload?week=${prevWeek(weekStart)}`)}
              className="hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="text-sm font-semibold text-on-surface px-2">{weekStart}</span>
            <button onClick={() => router.push(`/dashboard/workload?week=${nextWeek(weekStart)}`)}
              className="hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8">

        {/* ── Utilization summary banner ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_24px_48px_rgba(77,85,106,0.06)]">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Avg Variance</p>
            <div className={`text-2xl font-extrabold ${avgVariance > 0.5 ? 'text-energetic' : avgVariance < -0.5 ? 'text-excitement' : 'text-natural'}`}>
              {avgVariance > 0 ? '+' : ''}{avgVariance}h
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_24px_48px_rgba(77,85,106,0.06)]">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Bottlenecks</p>
            <div className={`text-2xl font-extrabold ${bottlenecks > 0 ? 'text-excitement' : 'text-natural'}`}>{bottlenecks}</div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_24px_48px_rgba(77,85,106,0.06)]">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Team Members</p>
            <div className="text-2xl font-extrabold text-on-surface">{data.members.length}</div>
          </div>
          <div className={`${varBadge.cls} rounded-xl p-6`}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Status</p>
            <div className="text-xl font-extrabold">{varBadge.label}</div>
          </div>
        </div>

        {/* ── Workload Grid ─────────────────────────────────────────────── */}
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0px_24px_48px_rgba(77,85,106,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-surface-container-low">
                  <th className="text-left p-6 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest w-56">
                    Team Member
                  </th>
                  {workingDays.map(dow => (
                    <th key={dow}
                      className={`text-center p-4 ${dow === todayDow
                        ? 'bg-gradient-to-br from-[#4d556a] to-[#656d84] text-white'
                        : ''
                      }`}>
                      <span className={`block text-[10px] font-bold uppercase ${dow === todayDow ? 'opacity-70' : 'text-on-surface-variant/60'}`}>
                        {DAY_SHORT[dow]}
                      </span>
                      <span className={`text-sm font-bold ${dow === todayDow ? 'text-white' : 'text-on-surface'}`}>
                        {formatDate(dow, weekStart)}
                      </span>
                    </th>
                  ))}
                  <th className="text-center p-4 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                    Week Variance
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.members.length === 0 ? (
                  <tr>
                    <td colSpan={workingDays.length + 2} className="text-center py-12 text-on-surface-variant text-sm font-medium">
                      No team members found.
                    </td>
                  </tr>
                ) : data.members.map((row, i) => {
                  const vBadge = varianceBadge(row.weekly_variance_hours)
                  return (
                    <tr key={row.user.id} className={`group ${i > 0 ? 'border-t border-surface-container-low/50' : ''}`}>
                      <td className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4d556a] to-[#656d84] flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {row.user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">{row.user.name}</p>
                            <p className="text-[10px] text-on-surface-variant">{row.user.available_hours}h/day</p>
                          </div>
                        </div>
                      </td>
                      {workingDays.map(dow => {
                        const cell = row.days[dow]
                        const isOff = !row.user.work_week.includes(dow)
                        if (isOff) {
                          return (
                            <td key={dow} className="p-2">
                              <div className="rounded-[24px] p-4 text-center bg-surface-container">
                                <span className="text-[10px] font-medium text-on-surface-variant/40">Off</span>
                              </div>
                            </td>
                          )
                        }
                        if (!cell || cell.planned_hours === 0) {
                          return (
                            <td key={dow} className="p-2">
                              <div className="rounded-[24px] p-4 text-center bg-surface-container">
                                <span className="text-[10px] font-medium text-on-surface-variant/40">—</span>
                              </div>
                            </td>
                          )
                        }
                        const style = cellStyle(cell.utilisation_pct, cell.planned_hours)
                        const isUnder = cell.utilisation_pct < 60 && cell.planned_hours > 0
                        return (
                          <td key={dow} className="p-2">
                            <button
                              onClick={() => router.push(`/tasks?assignee=${row.user.id}&date=${dateFromDow(dow, weekStart)}`)}
                              title={`View ${row.user.name}'s tasks for ${formatDate(dow, weekStart)}`}
                              className={`rounded-[24px] p-4 text-center ${style} transition-all w-full cursor-pointer hover:ring-2 hover:ring-primary/30 hover:scale-[1.03]`}
                            >
                              <div className="text-xs font-bold">{cell.planned_hours}h / {cell.actual_hours}h</div>
                              {isUnder && (
                                <div className="text-[10px] font-medium mt-0.5 opacity-70">Underload</div>
                              )}
                            </button>
                          </td>
                        )
                      })}
                      <td className="p-4 text-center">
                        <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${vBadge.cls}`}>
                          {vBadge.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Legend note ────────────────────────────────────────────────── */}
        <p className="text-[11px] text-on-surface-variant text-center font-medium pb-6">
          Format: <strong>Planned / Actual</strong> hours. Utilisation colour based on actual ÷ planned.
          Actual hours sourced from end-of-day wrap-ups.
        </p>
      </div>
    </div>
  )
}
