'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { WrapupTaskRow, TaskStatus } from '@/types'

const STATUS_BADGE: Record<TaskStatus, string> = {
  todo: 'bg-surface-container-high text-outline',
  in_progress: 'bg-secondary-container text-on-secondary-container',
  in_review: 'bg-[#fff4e5] text-[#b45309]',
  done: 'bg-emerald-100 text-emerald-700',
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Completed',
}

interface WrapupData {
  user_id: string
  date: string
  planned_tasks_json: WrapupTaskRow[]
  actual_tasks_json: WrapupTaskRow[]
  notes: string | null
  discrepancies_json: unknown
  submitted_at: string | null
}

interface Props {
  wrapup: WrapupData | null
  alreadySubmitted: boolean
}

export default function WrapupClient({ wrapup, alreadySubmitted }: Props) {
  const router = useRouter()
  const [actualRows, setActualRows] = useState<WrapupTaskRow[]>(
    wrapup?.actual_tasks_json ?? []
  )
  const [notes, setNotes] = useState(wrapup?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(alreadySubmitted)

  const today = wrapup?.date
    ? new Date(wrapup.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

  const planned = wrapup?.planned_tasks_json ?? []

  function updateActualHours(taskId: string, value: string) {
    const parsed = parseFloat(value)
    setActualRows((prev) =>
      prev.map((r) => (r.task_id === taskId ? { ...r, actual_hours: isNaN(parsed) ? 0 : parsed } : r))
    )
  }

  function matchIcon(p: WrapupTaskRow, a: WrapupTaskRow) {
    const delta = a.actual_hours - p.planned_hours
    if (Math.abs(delta) < 0.5) return { icon: 'check_circle', color: 'text-emerald-500' }
    return { icon: 'warning', color: 'text-amber-500' }
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/wrapup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planned_tasks_json: planned,
          actual_tasks_json: actualRows,
          notes: notes || null,
        }),
      })
      if (res.ok) {
        setSubmitted(true)
        router.refresh()
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!wrapup || (!planned.length && !submitted)) {
    return (
      <div className="max-w-6xl mx-auto px-12 py-12">
        <header className="mb-12">
          <h2 className="text-4xl font-extrabold text-[#4d556a] tracking-[-0.04em] mb-2">
            End of Day Wrap-up
          </h2>
          <p className="text-on-surface-variant font-medium opacity-70">{today}</p>
        </header>
        <div className="bg-[#fff4e5] text-[#b45309] p-6 rounded-2xl flex items-center gap-4">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            calendar_today
          </span>
          <p className="font-medium">No tasks were planned for today. Add tasks to your Weekly Plan first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-12 py-12 flex flex-col">
      {/* Decorative */}
      <div className="fixed top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-tertiary-fixed/20 blur-[120px] -z-10 pointer-events-none" />
      <div className="fixed bottom-[-5%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-secondary-fixed/30 blur-[100px] -z-10 pointer-events-none" />

      <header className="mb-12">
        <h2 className="text-4xl font-extrabold text-[#4d556a] tracking-[-0.04em] mb-2">
          End of Day Wrap-up
        </h2>
        <p className="text-on-surface-variant font-medium opacity-70">
          Review your progress and log daily achievements for {today}.
        </p>
      </header>

      {submitted && (
        <div className="mb-8 bg-emerald-50 text-emerald-700 p-5 rounded-2xl flex items-center gap-4">
          <span
            className="material-symbols-outlined text-emerald-500"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            verified
          </span>
          <div>
            <p className="font-bold">Wrap-up submitted!</p>
            {wrapup?.submitted_at && (
              <p className="text-sm opacity-70">
                Submitted at {new Date(wrapup.submitted_at).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Wrap-up Table */}
      <section className="mb-12">
        {/* Header */}
        <div className="grid grid-cols-12 px-6 py-4 mb-4 text-xs font-bold uppercase tracking-widest text-outline">
          <div className="col-span-5">Tasks</div>
          <div className="col-span-2 text-center">Planned Hrs</div>
          <div className="col-span-2 text-center">Actual Hrs</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-1 text-right">Match</div>
        </div>

        <div className="flex flex-col gap-4">
          {planned.map((p, i) => {
            const a = actualRows.find((r) => r.task_id === p.task_id) ?? { ...p }
            const match = matchIcon(p, a)
            return (
              <div
                key={p.task_id}
                className="grid grid-cols-12 items-center bg-surface-container-lowest p-6 rounded-2xl shadow-[0px_24px_48px_rgba(77,85,106,0.06)] group hover:-translate-y-0.5 transition-all"
              >
                <div className="col-span-5 flex items-center gap-4">
                  <div className="w-2 h-10 bg-[#4d556a] rounded-full" />
                  <div>
                    <h4 className="font-bold text-on-surface">{p.title}</h4>
                    <p className="text-xs text-on-surface-variant opacity-60">
                      {p.category ? `${p.category} • ` : ''}#{p.task_id.slice(-4).toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="col-span-2 text-center font-medium text-on-surface-variant">
                  {p.planned_hours}h
                </div>

                <div className="col-span-2 flex justify-center">
                  {submitted ? (
                    <span className="font-bold text-on-surface">{a.actual_hours}h</span>
                  ) : (
                    <input
                      type="number"
                      step={0.5}
                      min={0}
                      max={24}
                      className="w-16 h-10 bg-surface-container-low border-none rounded-xl text-center font-bold focus:ring-2 focus:ring-[#4d556a]/20"
                      value={a.actual_hours}
                      onChange={(e) => updateActualHours(p.task_id, e.target.value)}
                    />
                  )}
                </div>

                <div className="col-span-2 flex justify-center">
                  <span className={`px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full ${STATUS_BADGE[a.status as TaskStatus]}`}>
                    {STATUS_LABEL[a.status as TaskStatus]}
                  </span>
                </div>

                <div className="col-span-1 flex justify-end">
                  <span
                    className={`material-symbols-outlined ${match.color}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {match.icon}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Notes + Attachments */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div className="flex flex-col gap-4">
          <label className="text-sm font-bold text-[#4d556a] ml-2">Wrap-up Notes</label>
          <textarea
            className="w-full h-44 bg-surface-container-lowest border-none rounded-2xl p-6 shadow-[0px_24px_48px_rgba(77,85,106,0.06)] focus:ring-2 focus:ring-[#4d556a]/20 resize-none text-on-surface placeholder:opacity-40"
            placeholder="Summarize your key wins, blockers, or items carried over to tomorrow..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitted}
          />
        </div>
        <div className="flex flex-col gap-4">
          <label className="text-sm font-bold text-[#4d556a] ml-2">Attachments</label>
          <div className="flex-1 border-2 border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-lowest flex flex-col items-center justify-center p-8 transition-colors hover:bg-white cursor-pointer group">
            <span className="material-symbols-outlined text-4xl text-outline mb-4 group-hover:scale-110 transition-transform">
              cloud_upload
            </span>
            <p className="text-sm font-bold text-on-surface mb-1">Upload progress files</p>
            <p className="text-xs text-on-surface-variant opacity-60 text-center">
              Drag and drop or click to browse. Support PDF, PNG, JPG.
            </p>
            <button className="mt-6 px-6 py-2 bg-surface-container-low text-on-surface-variant text-xs font-bold rounded-full hover:bg-surface-container-high transition-colors">
              Select Files
            </button>
          </div>
        </div>
      </section>

      {/* Submit */}
      {!submitted && (
        <div className="flex flex-col items-center justify-center gap-6 pb-20">
          <div className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
            <span
              className="material-symbols-outlined text-emerald-500 text-lg"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            All hours logged and discrepancies noted.
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="text-white font-extrabold text-lg px-16 py-6 rounded-full shadow-2xl shadow-[#4d556a]/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
          >
            {submitting ? 'Submitting…' : 'Submit Wrap-up'}
          </button>
        </div>
      )}
    </div>
  )
}
