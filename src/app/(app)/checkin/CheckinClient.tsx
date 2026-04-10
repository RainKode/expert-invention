'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CheckinTaskSnapshot, TaskPriority } from '@/types'

const PRIORITY_BAR: Record<TaskPriority, string> = {
  high: 'bg-error',
  medium: 'bg-tertiary-container',
  low: 'bg-outline-variant',
}

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  high: 'text-error bg-error-container',
  medium: 'text-on-secondary-container bg-secondary-container',
  low: 'text-outline bg-surface-container-high',
}

interface CheckinData {
  user_id: string
  date: string
  tasks_json: CheckinTaskSnapshot[]
  notes: string | null
  submitted_at: string | null
}

interface Props {
  checkin: CheckinData | null
  alreadySubmitted: boolean
}

export default function CheckinClient({ checkin, alreadySubmitted }: Props) {
  const router = useRouter()
  const [tasks, setTasks] = useState<CheckinTaskSnapshot[]>(checkin?.tasks_json ?? [])
  const [notes, setNotes] = useState(checkin?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(alreadySubmitted)

  const today = checkin?.date
    ? new Date(checkin.date + 'T00:00:00').toLocaleDateString('en-US', {
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

  const totalPlanned = tasks.reduce((s, t) => s + t.planned_hours, 0)
  const availableHours = 8
  const capacityPct = Math.min(Math.round((totalPlanned / availableHours) * 100), 100)

  function toggleTask(taskId: string) {
    setTasks((prev) =>
      prev.map((t) => (t.task_id === taskId ? { ...t, confirmed: !t.confirmed } : t))
    )
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks_json: tasks, notes: notes || null }),
      })
      if (res.ok) {
        setSubmitted(true)
        router.refresh()
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!checkin || (!checkin.tasks_json.length && !submitted)) {
    return (
      <div className="max-w-4xl mx-auto px-12 py-12">
        <header className="mb-12">
          <h2 className="text-[2.5rem] font-extrabold text-[#4d556a] tracking-[-0.02em] leading-tight mb-2">
            Morning Check-in
          </h2>
          <p className="text-lg text-[#656d84] font-medium opacity-80">{today}</p>
        </header>
        <div className="bg-[#fff4e5] text-[#b45309] p-6 rounded-2xl flex items-center gap-4">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            warning
          </span>
          <p className="font-medium">No tasks planned for today. Head to your Weekly Plan to add tasks.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-12 py-12">
      {/* Decorative blobs */}
      <div className="fixed top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-tertiary-fixed/30 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[20%] w-[30vw] h-[30vw] bg-secondary-fixed/20 blur-[100px] rounded-full pointer-events-none -z-10" />

      <header className="mb-12">
        <h2 className="text-[2.5rem] font-extrabold text-[#4d556a] tracking-[-0.02em] leading-tight mb-2">
          Morning Check-in
        </h2>
        <p className="text-lg text-[#656d84] font-medium opacity-80">{today}</p>
      </header>

      {submitted && (
        <div className="mb-8 bg-primary-container/20 text-primary p-5 rounded-2xl flex items-center gap-4">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          <div>
            <p className="font-bold">Check-in submitted!</p>
            {checkin?.submitted_at && (
              <p className="text-sm opacity-70">
                Submitted at {new Date(checkin.submitted_at).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {/* Task Cards */}
        {tasks.map((task) => (
          <div
            key={task.task_id}
            className={`bg-surface-container-lowest rounded-2xl p-6 shadow-[0px_24px_48px_rgba(77,85,106,0.06)] flex items-center justify-between group transition-all ${!task.confirmed ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-6">
              <div className={`w-1.5 h-12 rounded-full ${PRIORITY_BAR[task.priority]}`} />
              <div>
                <h3 className="text-lg font-bold text-on-surface">{task.title}</h3>
                <p className="text-sm text-on-surface-variant">
                  {task.category ? `${task.category} • ` : ''}
                  {task.planned_hours}h planned
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${PRIORITY_BADGE[task.priority]}`}>
                {task.priority} priority
              </span>
              {!submitted && (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={task.confirmed}
                    onChange={() => toggleTask(task.task_id)}
                  />
                  <div className="w-14 h-8 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#4d556a]" />
                </label>
              )}
            </div>
          </div>
        ))}

        {/* Notes */}
        <div className="mt-6">
          <label className="block text-sm font-bold text-on-surface-variant mb-4 ml-2">
            Internal Notes &amp; Blockers
          </label>
          <textarea
            className="w-full bg-surface-container-lowest border-none focus:ring-2 focus:ring-[#4d556a]/20 rounded-[1.5rem] p-8 min-h-[160px] shadow-[0px_12px_24px_rgba(77,85,106,0.03)] text-on-surface placeholder:text-outline/50 transition-all"
            placeholder="Anything else on your mind today?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitted}
          />
        </div>

        {/* Insight bento */}
        <div className="grid grid-cols-3 gap-6 mt-6">
          <div className="col-span-2 bg-tertiary-container/20 p-8 rounded-2xl flex flex-col justify-between overflow-hidden relative">
            <div className="relative z-10">
              <h4 className="text-tertiary font-bold text-xl mb-2">Today&apos;s Load</h4>
              <p className="text-on-tertiary-fixed-variant max-w-sm">
                {tasks.filter((t) => t.confirmed).length} of {tasks.length} tasks confirmed for today.
                Total planned time: <span className="font-bold">{totalPlanned}h</span>.
              </p>
            </div>
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] opacity-10 text-tertiary rotate-12">
              psychology
            </span>
          </div>
          <div className="p-8 rounded-2xl text-white flex flex-col justify-center items-center text-center" style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}>
            <span className="text-4xl font-black mb-2">{capacityPct}%</span>
            <p className="text-xs uppercase tracking-widest opacity-70">Capacity Used</p>
            <div className="w-full h-1 bg-white/20 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${capacityPct}%` }} />
            </div>
          </div>
        </div>

        {/* Submit */}
        {!submitted && (
          <div className="flex justify-center mt-12 mb-20">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="text-white px-12 py-5 rounded-full font-bold text-lg shadow-xl shadow-[#4d556a]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
            >
              {submitting ? 'Submitting…' : 'Submit Check-in'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
