'use client'
// TeamPulseClient — manager's team capacity grid, warnings, overdue tasks, completion rates

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { TeamPulseData, PlanSubmissionStatus } from '@/types'

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(dayOfWeek: number, weekStart: string) {
  const monday = new Date(weekStart)
  // weekStart is a Monday (day=1). dow 0=Sun, 1=Mon …
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1   // offset from Monday
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

function capacityColor(planned: number, available: number) {
  if (available === 0) return 'bg-surface-container text-on-surface-variant'
  const pct = (planned / available) * 100
  if (pct >= 80 && pct <= 110) return 'bg-natural-10 text-natural'
  if (pct > 110) return 'bg-excitement-10 text-excitement'
  if (pct >= 50) return 'bg-energetic-10 text-energetic'
  return 'bg-excitement-10 text-excitement'
}

function capacityBar(planned: number, available: number) {
  if (available === 0) return 'bg-surface-container-high'
  const pct = (planned / available) * 100
  if (pct >= 80 && pct <= 110) return 'bg-natural'
  if (pct > 110) return 'bg-excitement'
  if (pct >= 50) return 'bg-energetic'
  return 'bg-excitement'
}

const STATUS_BADGE: Record<PlanSubmissionStatus, { label: string; cls: string }> = {
  submitted: { label: 'Submitted', cls: 'bg-kindness-10 text-kindness' },
  draft: { label: 'Draft', cls: 'bg-energetic-10 text-energetic' },
  fluid: { label: 'Fluid', cls: 'bg-integrity-10 text-integrity' },
}

interface Props {
  data: TeamPulseData
  weekStart: string
  workingDays: number[]
}

interface AcknowledgeModalState {
  open: boolean
  employeeId: string
  employeeName: string
  unplannedDays: number[]
}

export default function TeamPulseClient({ data, weekStart, workingDays }: Props) {
  const router = useRouter()
  const [ackModal, setAckModal] = useState<AcknowledgeModalState>({
    open: false, employeeId: '', employeeName: '', unplannedDays: [],
  })
  const [ackNote, setAckNote] = useState('')
  const [ackSaving, setAckSaving] = useState(false)
  const [toastError, setToastError] = useState<string | null>(null)

  const todayDow = new Date().getDay()

  async function handleAcknowledge() {
    setAckSaving(true)
    try {
      const res = await fetch('/api/dashboard/acknowledge-warning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: ackModal.employeeId,
          week_start: weekStart,
          unplanned_days: ackModal.unplannedDays,
          note: ackNote || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setToastError(d.error ?? 'Failed to acknowledge. Please try again.')
        return
      }
      setAckModal({ open: false, employeeId: '', employeeName: '', unplannedDays: [] })
      setAckNote('')
      router.refresh()
    } finally {
      setAckSaving(false)
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-10 pt-4 flex items-end justify-between">
        <div>
          <h1 className="text-[1.5rem] font-bold tracking-tight text-on-surface">Team Pulse</h1>
          <p className="text-on-surface-variant font-medium mt-1">Week of {weekStart}</p>
        </div>
        {/* Week navigation */}
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm">
          <button onClick={() => router.push(`/dashboard/team-pulse?week=${prevWeek(weekStart)}`)}
            className="hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <span className="text-sm font-semibold text-on-surface px-2">{weekStart}</span>
          <button onClick={() => router.push(`/dashboard/team-pulse?week=${nextWeek(weekStart)}`)}
            className="hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="space-y-10">

        {/* ── Big Fat Warning Banner ─────────────────────────────────────── */}
        {data.unplanned_members.length > 0 && (
          <section className="rounded-xl bg-energetic-10 overflow-hidden shadow-[0px_24px_48px_rgba(254,94,32,0.06)] relative">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-energetic" />
            <div className="p-8 flex items-start gap-6">
              <div className="w-12 h-12 rounded-full bg-energetic flex items-center justify-center text-white shrink-0">
                <span className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              </div>
              <div className="flex-1">
                <h3 className="text-energetic font-bold text-lg mb-1">Unplanned Capacity Detected</h3>
                <p className="text-energetic/80 font-medium text-sm mb-4">
                  The following team members have no tasks allocated for upcoming working days.
                  This may result in critical workflow bottlenecks.
                </p>
                <div className="flex flex-wrap gap-3">
                  {data.unplanned_members.map(m => {
                    const memberRow = data.members.find(r => r.user.id === m.id)
                    return (
                      <div key={m.id} className="flex items-center gap-3 bg-white/60 px-4 py-2 rounded-full backdrop-blur-sm">
                        <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface">
                          {m.name.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-energetic">{m.name}</span>
                        <div className="flex gap-1">
                          {(memberRow?.unplanned_days ?? []).map(dow => (
                            <span key={dow} className="text-[10px] font-bold bg-energetic-20 text-energetic px-2 py-0.5 rounded-full">
                              {DAY_SHORT[dow]}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => setAckModal({
                            open: true,
                            employeeId: m.id,
                            employeeName: m.name,
                            unplannedDays: memberRow?.unplanned_days ?? [],
                          })}
                          className="text-[10px] font-bold text-energetic underline hover:no-underline">
                          Acknowledge
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Capacity Grid ─────────────────────────────────────────────── */}
        <section className="space-y-6">
          <div className="flex items-end justify-between px-2">
            <h3 className="text-lg font-bold text-on-surface tracking-tight">Capacity Matrix</h3>
            <div className="flex gap-4 text-xs font-bold text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" /> 80–100%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary" /> 50–79%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-error" /> &lt;50%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl overflow-hidden shadow-[0px_24px_48px_rgba(77,85,106,0.06)]">
            <div className={`grid`} style={{
              gridTemplateColumns: `240px repeat(${workingDays.length + 1}, 1fr)`
            }}>
              {/* Header row */}
              <div className="bg-surface-container-low p-6 text-[10px] font-bold text-on-surface-variant/60 tracking-widest uppercase">
                Team Member
              </div>
              {workingDays.map(dow => (
                <div key={dow}
                  className={`p-6 text-center ${dow === todayDow
                    ? 'bg-integrity text-white shadow-xl'
                    : 'bg-surface-container-low'
                  }`}>
                  <span className={`block text-[10px] font-bold uppercase ${dow === todayDow ? 'opacity-70' : 'text-on-surface-variant/60'}`}>
                    {DAY_SHORT[dow]}
                  </span>
                  <span className={`text-sm font-bold ${dow === todayDow ? 'bg-integrity text-white' : 'text-on-surface'}`}>
                    {formatDate(dow, weekStart)}
                  </span>
                </div>
              ))}
              {/* Status header */}
              <div className="bg-surface-container-low p-6 text-[10px] font-bold text-on-surface-variant/60 tracking-widest uppercase text-center">
                Status
              </div>

              {/* Member rows */}
              {data.members.map((row, i) => (
                <>
                  <div key={`${row.user.id}-name`}
                    className={`p-6 flex items-center gap-4 bg-white`}>
                    <div className="w-10 h-10 rounded-full bg-integrity flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {row.user.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold truncate">{row.user.name}</p>
                      <p className="text-[10px] text-on-surface-variant">{row.user.available_hours}h/day</p>
                    </div>
                  </div>

                  {workingDays.map(dow => {
                    const planned = row.day_hours[dow] ?? 0
                    const available = row.user.work_week.includes(dow) ? row.user.available_hours : 0
                    const isOff = !row.user.work_week.includes(dow)
                    const cellColor = isOff ? 'bg-surface-container text-on-surface-variant/40' : capacityColor(planned, available)
                    const barColor = capacityBar(planned, available)
                    const barWidth = available > 0 ? Math.min(Math.round((planned / available) * 100), 100) : 0

                    return (
                      <div key={`${row.user.id}-${dow}`}
                        className={`p-4 flex flex-col items-center justify-center gap-1`}>
                        {isOff ? (
                          <span className="text-[10px] font-medium text-on-surface-variant/40">Off</span>
                        ) : (
                          <>
                            <div className={`${cellColor} px-3 py-1.5 rounded-lg text-xs font-bold`}>
                              {planned} / {available}
                            </div>
                            <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                              <div className={`h-full ${barColor}`} style={{ width: `${barWidth}%` }} />
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}

                  {/* Status cell */}
                  <div key={`${row.user.id}-status`}
                    className={`p-4 flex items-center justify-center`}>
                    {row.submission_status ? (
                      <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${STATUS_BADGE[row.submission_status as PlanSubmissionStatus].cls}`}>
                        {STATUS_BADGE[row.submission_status as PlanSubmissionStatus].label}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-on-surface-variant/40">No Plan</span>
                    )}
                  </div>
                </>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom bento: Overdue + Completion Rates ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Overdue Tasks */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-bold text-on-surface tracking-tight">Overdue Tasks</h3>
              {data.overdue_tasks.length > 0 && (
                <span className="text-xs font-bold text-error bg-error-container px-3 py-1 rounded-full">
                  {data.overdue_tasks.length} Immediate
                </span>
              )}
            </div>
            <div className="bg-white rounded-xl p-4 shadow-[0px_24px_48px_rgba(77,85,106,0.06)] space-y-2">
              {data.overdue_tasks.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant text-sm font-medium">
                  No overdue tasks — team is on track.
                </div>
              ) : data.overdue_tasks.map(t => (
                <div key={t.id} className="flex items-center gap-4 p-4 hover:bg-surface-container-low rounded-lg transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-error-container flex items-center justify-center text-error shrink-0">
                    <span className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 0" }}>assignment_late</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{t.title}</p>
                    <p className="text-xs text-on-surface-variant">Assigned to {t.assignee_name}</p>
                  </div>
                  <div className="bg-error-container text-error px-3 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0">
                    {t.days_overdue}d Overdue
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Completion Rates */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-bold text-on-surface tracking-tight">Task Completion Rate</h3>
              <span className="text-xs font-bold text-on-surface-variant">This Week</span>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-[0px_24px_48px_rgba(77,85,106,0.06)] space-y-6">
              {data.members.length === 0 ? (
                <p className="text-on-surface-variant text-sm text-center py-4">No team members found.</p>
              ) : data.members.map(row => (
                <div key={row.user.id} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-integrity flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {row.user.name.charAt(0)}
                      </div>
                      <span className="text-sm font-bold">{row.user.name}</span>
                    </div>
                    <span className="text-sm font-extrabold text-integrity">{row.completion_rate}%</span>
                  </div>
                  <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
                    <div
                      className="h-full bg-integrity rounded-full transition-all duration-500"
                      style={{ width: `${row.completion_rate}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-on-surface-variant">
                    {row.completed_tasks} of {row.total_tasks} tasks done
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ── Acknowledge Warning Modal ────────────────────────────────────── */}
      {ackModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface/80 backdrop-blur-[20px] p-6">
          <div className="bg-white w-full max-w-[480px] rounded-[24px] shadow-[0px_24px_48px_rgba(77,85,106,0.06)] overflow-hidden flex flex-col">
            <div className="pt-10 px-8 pb-6">
              <h2 className="text-xl font-bold tracking-tight text-on-surface">Acknowledge Unplanned Days</h2>
            </div>
            <div className="px-8 pb-8 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-integrity flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {ackModal.employeeName.charAt(0)}
                </div>
                <div>
                  <span className="text-sm font-semibold text-on-surface">{ackModal.employeeName}</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  Please acknowledge the following unplanned days:
                </p>
                <div className="flex gap-2">
                  {ackModal.unplannedDays.map(dow => (
                    <span key={dow} className="px-4 py-1.5 bg-surface-container-high rounded-full text-xs font-semibold text-primary">
                      {DAY_SHORT[dow]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-[#fef9f0] p-4 rounded-[20px] flex gap-3">
                <span className="material-symbols-outlined text-[#b47c00] text-xl"
                  style={{ fontVariationSettings: "'FILL' 0" }}>history_edu</span>
                <p className="text-xs leading-relaxed text-[#7a5300] font-medium">
                  Acknowledging creates an audit log entry for compliance review. This action cannot be undone once submitted.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-on-surface-variant px-1">Add a note (optional)</label>
                <div className="relative">
                  <textarea
                    value={ackNote}
                    onChange={e => setAckNote(e.target.value)}
                    placeholder="Provide context for these unplanned days..."
                    rows={4}
                    maxLength={500}
                    className="w-full bg-surface-container-low border-none rounded-[20px] p-4 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                  />
                  <div className="absolute bottom-4 right-4 text-[10px] font-bold text-on-surface-variant/40 tracking-wider">
                    {ackNote.length} / 500
                  </div>
                </div>
              </div>
            </div>
            <div className="px-8 pb-10 flex gap-3">
              <button
                onClick={() => { setAckModal({ open: false, employeeId: '', employeeName: '', unplannedDays: [] }); setAckNote('') }}
                className="flex-1 py-3.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-sm font-bold hover:bg-tertiary-fixed-dim transition-all">
                Cancel
              </button>
              <button
                onClick={handleAcknowledge}
                disabled={ackSaving}
                className="flex-1 py-3.5 rounded-full bg-integrity text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50">
                {ackSaving ? 'Saving…' : 'Acknowledge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error toast */}
      {toastError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-sm font-semibold shadow-lg bg-error-container text-on-error-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {toastError}
            <button onClick={() => setToastError(null)} className="ml-2 opacity-60 hover:opacity-100">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
