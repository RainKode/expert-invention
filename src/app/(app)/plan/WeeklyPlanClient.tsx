'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import type { WeeklyPlan, PlanEntry, PlanComment, TaskPriority, PlanningMode } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: 'bg-excitement-10 text-excitement',
  medium: 'bg-energetic-10 text-energetic',
  low: 'bg-surface-container-high text-outline',
}

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

function capacityColor(planned: number, available: number) {
  if (available === 0) return 'bg-surface-container-high'
  const pct = (planned / available) * 100
  if (pct >= 80 && pct <= 100) return 'bg-natural'
  if (pct > 100) return 'bg-excitement'
  if (pct >= 50) return 'bg-energetic'
  return 'bg-excitement'
}

function capacityTextColor(planned: number, available: number) {
  if (available === 0) return 'text-outline'
  const pct = (planned / available) * 100
  if (pct >= 80 && pct <= 100) return 'text-natural'
  if (pct > 100 || pct > 0) return 'text-energetic'
  return 'text-excitement'
}

// ─── Entry / Pool Task types ──────────────────────────────────────────────────

interface TaskInfo {
  id: string
  title: string
  priority: TaskPriority
  status: string
  estimated_hours: number | null
  project?: { name: string } | null
}

interface EntryWithTask extends Omit<PlanEntry, 'task'> {
  task: TaskInfo
}

// ─── Draggable Pool Pill ──────────────────────────────────────────────────────

function PoolPill({ task }: { task: TaskInfo }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pool:${task.id}`,
    data: { source: 'pool', task },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`bg-white px-5 py-3 rounded-full flex items-center gap-3 shadow-[0px_2px_8px_rgba(77,85,106,0.06)] hover:shadow-[0px_4px_24px_rgba(77,85,106,0.08)] transition-all cursor-grab active:cursor-grabbing group select-none ${isDragging ? 'opacity-40' : ''}`}
    >
      <span className="text-sm font-semibold text-on-surface truncate max-w-[160px]">{task.title}</span>
      {task.project?.name && (
        <span className="bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold px-2 py-0.5 rounded shrink-0">
          {task.project.name}
        </span>
      )}
      <span className="material-symbols-outlined text-sm opacity-20 group-hover:opacity-100 shrink-0">drag_pan</span>
    </div>
  )
}

// ─── Draggable Task Card ──────────────────────────────────────────────────────

function TaskCard({
  entry,
  planId,
  onHoursChange,
  onRemove,
  locked,
}: {
  entry: EntryWithTask
  planId: string
  onHoursChange: (entryId: string, hours: number) => void
  onRemove: (entry: EntryWithTask) => void
  locked: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `entry:${entry.id}`,
    data: { source: 'entry', entry },
    disabled: locked,
  })

  return (
    <div
      ref={setNodeRef}
      className={`bg-white p-5 rounded-3xl shadow-sm group hover:shadow-md transition-all relative overflow-hidden ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-integrity rounded-l-3xl" />
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${PRIORITY_COLORS[entry.task.priority]}`}>
          {entry.task.priority}
        </span>
        <div className="flex items-center gap-1">
          {entry.is_carryover && (
            <span className="material-symbols-outlined text-sm text-tertiary" title="Carried over">
              autorenew
            </span>
          )}
          {!locked && (
            <button
              onClick={() => onRemove(entry)}
              className="material-symbols-outlined text-sm opacity-20 group-hover:opacity-60 hover:!opacity-100 hover:text-error transition-opacity"
            >
              close
            </button>
          )}
          {!locked && (
            <span
              {...listeners}
              {...attributes}
              className="material-symbols-outlined text-lg opacity-20 group-hover:opacity-100 transition-opacity cursor-grab"
            >
              drag_indicator
            </span>
          )}
        </div>
      </div>
      <h4 className="text-sm font-bold text-on-surface leading-snug mb-4 line-clamp-2">{entry.task.title}</h4>
      <div className="flex items-center justify-between">
        {entry.task.project?.name && (
          <span className="text-[10px] font-bold text-outline uppercase">{entry.task.project.name}</span>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="number"
            min={0}
            max={24}
            step={0.5}
            className="w-12 bg-transparent border-none p-0 text-right font-bold focus:ring-0 text-integrity text-sm"
            value={entry.planned_hours}
            disabled={locked}
            onChange={(e) => onHoursChange(entry.id, parseFloat(e.target.value) || 0)}
          />
          <span className="text-xs font-bold opacity-40">hrs</span>
        </div>
      </div>
    </div>
  )
}

// ─── Day Column Drop Zone ─────────────────────────────────────────────────────

function DayColumn({
  dayNum,
  weekStartISO,
  isToday,
  entries,
  availableHours,
  planId,
  locked,
  onHoursChange,
  onRemoveEntry,
}: {
  dayNum: number
  weekStartISO: string
  isToday: boolean
  entries: EntryWithTask[]
  availableHours: number
  planId: string
  locked: boolean
  onHoursChange: (entryId: string, hours: number) => void
  onRemoveEntry: (entry: EntryWithTask) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${dayNum}` })

  const weekStart = new Date(weekStartISO + 'T00:00:00')
  const dayDate = new Date(weekStart)
  dayDate.setDate(weekStart.getDate() + (dayNum - 1)) // dayNum 1=Mon 5=Fri offset from Monday

  const dayLabel = dayDate.toLocaleDateString('en-US', { weekday: 'long', day: '2-digit' })

  const totalHours = entries.reduce((s, e) => s + e.planned_hours, 0)
  const barWidth = availableHours > 0 ? Math.min((totalHours / availableHours) * 100, 100) : 0
  const barColor = capacityColor(totalHours, availableHours)
  const textColor = capacityTextColor(totalHours, availableHours)

  // Relative day label
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((dayDate.getTime() - today.getTime()) / 86400000)
  let relLabel = ''
  if (diffDays === 0) relLabel = 'Today'
  else if (diffDays === 1) relLabel = 'Tomorrow'
  else if (diffDays === -1) relLabel = 'Yesterday'
  else if (diffDays > 1 && diffDays < 7) relLabel = DAY_NAMES[dayDate.getDay()]
  else relLabel = DAY_NAMES[dayDate.getDay()]

  return (
    <div className="flex flex-col gap-4 min-h-0">
      {/* Day Header */}
      <div
        className={`p-5 rounded-[32px] ${isToday ? 'text-white shadow-xl shadow-[#2226F7]/10 bg-integrity' : 'bg-surface-container-low text-on-surface-variant'}`}
      >
        <p className={`text-xs font-bold uppercase tracking-widest ${isToday ? 'opacity-70' : 'opacity-50'}`}>
          {relLabel}
        </p>
        <h3 className="text-xl font-extrabold tracking-tight">{dayLabel}</h3>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-3 flex-1 min-h-[80px] p-2 rounded-2xl transition-colors ${isOver ? 'bg-integrity/5 ring-2 ring-integrity/20' : ''}`}
      >
        {entries.map((entry) => (
          <TaskCard
            key={entry.id}
            entry={entry}
            planId={planId}
            onHoursChange={onHoursChange}
            onRemove={onRemoveEntry}
            locked={locked}
          />
        ))}

        {!locked && (
          <div className="border-2 border-dashed border-outline-variant/30 rounded-[24px] p-6 flex flex-col items-center justify-center gap-2 group hover:bg-white/50 transition-all">
            <span className="material-symbols-outlined text-outline-variant group-hover:scale-110 transition-transform">
              add_circle
            </span>
            <span className="text-xs font-bold text-outline-variant">Drop task here</span>
          </div>
        )}
      </div>

      {/* Capacity Bar */}
      <div className="pt-4 flex flex-col gap-2">
        <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
          <div className={`h-full ${barColor} transition-all`} style={{ width: `${barWidth}%` }} />
        </div>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${textColor}`}>
          Planned {totalHours} / {availableHours} hrs
        </p>
      </div>
    </div>
  )
}

// ─── Comment Section ──────────────────────────────────────────────────────────

function CommentsSection({
  comments,
  planId,
  canComment,
}: {
  comments: PlanComment[]
  planId: string
  canComment: boolean
}) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit() {
    if (!text.trim()) return
    setSubmitting(true)
    setCommentError(null)
    try {
      const res = await fetch(`/api/plans/${planId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (res.ok) {
        setText('')
        router.refresh()
      } else {
        setCommentError('Failed to post comment. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pt-8 border-t border-outline-variant/20">
      <h4 className="font-bold text-lg tracking-tight mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-integrity">comment</span>
        Manager Comments
      </h4>

      {comments.length === 0 && (
        <p className="text-sm text-outline italic">No comments yet.</p>
      )}

      <div className="flex flex-col gap-6">
        {comments.map((comment) => {
          const author = Array.isArray(comment.author) ? comment.author[0] : comment.author
          return (
            <div key={comment.id} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-integrity flex items-center justify-center text-white font-bold text-sm shrink-0">
                {author?.name?.charAt(0).toUpperCase() ?? 'M'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-on-surface">{author?.name ?? 'Manager'}</span>
                  <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                    {author?.role?.replace(/_/g, ' ') ?? 'Manager'}
                  </span>
                  <span className="text-xs font-medium text-outline">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="bg-surface-container-highest/30 p-5 rounded-3xl rounded-tl-none">
                  <p className="text-sm text-on-surface-variant leading-relaxed italic">"{comment.text}"</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {canComment && (
        <div className="mt-6">
          {commentError && (
            <p className="text-xs text-error mb-2 ml-1">{commentError}</p>
          )}
          <div className="flex gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Leave a comment..."
            className="flex-1 bg-white border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-integrity/20 resize-none"
            rows={3}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !text.trim()}
            className="px-6 py-2 rounded-full font-bold text-sm bg-integrity text-white disabled:opacity-50 transition-all self-end"
          >
            {submitting ? 'Sending…' : 'Comment'}
          </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────────

interface Props {
  userId: string
  userRole: string
  planId: string | null
  weekStartISO: string
  plan: WeeklyPlan | null
  entries: EntryWithTask[]
  comments: PlanComment[]
  poolTasks: TaskInfo[]
  availableHours: number
  workWeek: number[]
  planningMode: PlanningMode
}

export default function WeeklyPlanClient({
  userId,
  userRole,
  planId,
  weekStartISO,
  plan,
  entries: initialEntries,
  comments,
  poolTasks: initialPool,
  availableHours,
  workWeek,
  planningMode,
}: Props) {
  const router = useRouter()
  const [entries, setEntries] = useState<EntryWithTask[]>(initialEntries as EntryWithTask[])
  const [poolTasks, setPoolTasks] = useState<TaskInfo[]>(initialPool)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [saving, setSaving] = useState(false)

  const canComment = ['assistant_manager', 'manager', 'senior_manager', 'admin'].includes(userRole)
  const locked = plan?.locked ?? false
  const isFluid = planningMode === 'fluid'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // Day numbers in plan: convert work_week (0-6 Sun-Sat) to column index
  // We always show Mon-Fri (1-5). If work_week differs, only show its days.
  const displayDays = workWeek.includes(1)
    ? workWeek.filter((d) => d >= 1 && d <= 5).sort()
    : [1, 2, 3, 4, 5] // fallback Mon-Fri

  // Today's day of week (0=Sun..6=Sat)
  const todayDow = new Date().getDay()

  // Offset from Monday to get date for each day column
  // dayNum is 0-6 (Sun-Sat). Column date = weekStart + (dayNum - 1) for Mon(1)
  // weekStart is always Monday.

  function getEntriesForDay(dow: number) {
    return entries.filter((e) => e.day_of_week === dow) as EntryWithTask[]
  }

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveDragId(null)
      const { active, over } = event
      if (!over || locked) return

      const activeId = active.id as string
      const overId = over.id as string

      if (!overId.startsWith('day:')) return

      const targetDow = parseInt(overId.replace('day:', ''), 10)

      if (activeId.startsWith('pool:')) {
        // Dropping from pool to a day
        const taskId = activeId.replace('pool:', '')
        const task = poolTasks.find((t) => t.id === taskId)
        if (!task || !planId) return

        // Optimistic: remove from pool, add to entries
        setPoolTasks((prev) => prev.filter((t) => t.id !== taskId))
        const optimisticEntry: EntryWithTask = {
          id: `temp-${taskId}-${targetDow}`,
          plan_id: planId,
          task_id: taskId,
          day_of_week: targetDow,
          planned_hours: task.estimated_hours ?? 1,
          is_carryover: false,
          original_date: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          task,
        }
        setEntries((prev) => [...prev, optimisticEntry])

        setSaving(true)
        try {
          const res = await fetch(`/api/plans/${planId}/entries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              task_id: taskId,
              day_of_week: targetDow,
              planned_hours: task.estimated_hours ?? 1,
            }),
          })
          const json = await res.json()
          if (json.entry) {
            // Replace optimistic with real entry
            setEntries((prev) =>
              prev.map((e) => (e.id === optimisticEntry.id ? { ...json.entry, task } : e))
            )
          }
        } catch {
          // Rollback
          setEntries((prev) => prev.filter((e) => e.id !== optimisticEntry.id))
          setPoolTasks((prev) => [...prev, task])
        } finally {
          setSaving(false)
        }
      } else if (activeId.startsWith('entry:')) {
        // Moving entry from one day to another
        const entryId = activeId.replace('entry:', '')
        const entry = entries.find((e) => e.id === entryId)
        if (!entry || entry.day_of_week === targetDow || !planId) return

        // Remove old entry, add new
        setEntries((prev) => prev.filter((e) => e.id !== entryId))

        setSaving(true)
        try {
          // Delete old entry
          await fetch(`/api/plans/${planId}/entries?task_id=${entry.task_id}&day_of_week=${entry.day_of_week}`, {
            method: 'DELETE',
          })
          // Create new entry
          const res = await fetch(`/api/plans/${planId}/entries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              task_id: entry.task_id,
              day_of_week: targetDow,
              planned_hours: entry.planned_hours,
            }),
          })
          const json = await res.json()
          if (json.entry) {
            setEntries((prev) => [...prev, { ...json.entry, task: entry.task }])
          }
        } catch {
          setEntries((prev) => [...prev, entry])
        } finally {
          setSaving(false)
        }
      }
    },
    [entries, poolTasks, planId, locked]
  )

  const handleHoursChange = useCallback(
    async (entryId: string, hours: number) => {
      const entry = entries.find((e) => e.id === entryId)
      if (!entry || !planId) return

      setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, planned_hours: hours } : e)))

      await fetch(`/api/plans/${planId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: entry.task_id,
          day_of_week: entry.day_of_week,
          planned_hours: hours,
        }),
      })
    },
    [entries, planId]
  )

  const handleRemoveEntry = useCallback(
    async (entry: EntryWithTask) => {
      if (!planId || locked) return
      setEntries((prev) => prev.filter((e) => e.id !== entry.id))
      setPoolTasks((prev) => [...prev, entry.task])

      await fetch(`/api/plans/${planId}/entries?task_id=${entry.task_id}&day_of_week=${entry.day_of_week}`, {
        method: 'DELETE',
      })
    },
    [planId, locked]
  )

  const handleSubmitPlan = async () => {
    if (!planId) return
    setSubmitting(true)
    try {
      await fetch(`/api/plans/${planId}/submit`, { method: 'POST' })
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  const statusBadge = () => {
    if (!plan) return null
    const { submission_status } = plan
    if (submission_status === 'submitted')
      return <span className="bg-primary-container/20 text-primary px-4 py-1.5 rounded-full text-xs font-bold tracking-wide">Submitted</span>
    if (submission_status === 'fluid')
      return <span className="bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full text-xs font-bold tracking-wide">Fluid Mode</span>
    return <span className="bg-[#fff4e5] text-[#b45309] px-4 py-1.5 rounded-full text-xs font-bold tracking-wide">Not Submitted</span>
  }

  // Active drag overlay
  const activeDragData = activeDragId
    ? activeDragId.startsWith('pool:')
      ? poolTasks.find((t) => t.id === activeDragId.replace('pool:', ''))
      : entries.find((e) => e.id === activeDragId.replace('entry:', ''))?.task
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen flex flex-col">
        {/* Page Header */}
        <div className="px-12 py-6 flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-extrabold text-on-surface tracking-[-0.02em] mb-1">My Plan</h2>
              <div className="flex items-center gap-3">
                {/* Week Navigation */}
                <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full shadow-sm">
                  <button
                    onClick={() => router.push(`/plan?week=${prevMonday(weekStartISO)}`)}
                    className="material-symbols-outlined text-sm hover:text-integrity transition-colors"
                  >
                    chevron_left
                  </button>
                  <span className="text-sm font-semibold tracking-tight">{formatWeekRange(weekStartISO)}</span>
                  <button
                    onClick={() => router.push(`/plan?week=${nextMonday(weekStartISO)}`)}
                    className="material-symbols-outlined text-sm hover:text-integrity transition-colors"
                  >
                    chevron_right
                  </button>
                </div>
                {statusBadge()}
                {saving && (
                  <span className="text-xs text-outline animate-pulse">Saving…</span>
                )}
              </div>
            </div>

            {!locked && !isFluid && (
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitPlan}
                  disabled={submitting}
                  className="px-8 py-2.5 rounded-full font-bold text-sm bg-integrity text-white shadow-lg shadow-[#2226F7]/20 transition-all hover:-translate-y-px disabled:opacity-60"
                >
                  {submitting ? 'Submitting…' : 'Submit Week'}
                </button>
              </div>
            )}

            {locked && (
              <div className="flex gap-3">
                <span className="px-6 py-2.5 rounded-full bg-primary-container/20 text-primary font-bold text-sm">
                  Plan Submitted ✓
                </span>
                {canComment && (
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/plans/${planId}/unlock`, { method: 'POST' })
                      if (res.ok) {
                        router.refresh()
                      }
                    }}
                    className="px-6 py-2.5 rounded-full bg-surface-container-high font-bold text-sm hover:bg-surface-container-highest transition-all"
                  >
                    Unlock Plan
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Week Grid */}
        <div className={`px-12 grid gap-6 flex-1 mb-8`} style={{ gridTemplateColumns: `repeat(${displayDays.length}, 1fr)` }}>
          {displayDays.map((dow, colIdx) => {
            const weekStart = new Date(weekStartISO + 'T00:00:00')
            const dayDate = new Date(weekStart)
            dayDate.setDate(weekStart.getDate() + (dow - 1))
            const isToday = dow === todayDow && (() => {
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              return dayDate.getTime() === today.getTime()
            })()

            return (
              <DayColumn
                key={dow}
                dayNum={dow}
                weekStartISO={weekStartISO}
                isToday={isToday}
                entries={getEntriesForDay(dow)}
                availableHours={availableHours}
                planId={planId ?? ''}
                locked={locked}
                onHoursChange={handleHoursChange}
                onRemoveEntry={handleRemoveEntry}
              />
            )
          })}
        </div>

        {/* Task Pool & Comments */}
        <div className="px-12 pb-12">
          <div className="bg-surface-container-low rounded-[40px] p-8 flex flex-col gap-8 shadow-inner shadow-black/5">
            {/* Unplanned Task Pool */}
            {!locked && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-integrity">inventory_2</span>
                  <h4 className="font-bold text-lg tracking-tight">Unplanned Task Pool</h4>
                </div>
                {poolTasks.length === 0 ? (
                  <p className="text-sm text-outline italic">All tasks are planned for this week.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {poolTasks.map((task) => (
                      <PoolPill key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Manager Comments */}
            <CommentsSection
              comments={comments}
              planId={planId ?? ''}
              canComment={canComment}
            />
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeDragData ? (
          <div className="bg-white px-5 py-3 rounded-full shadow-xl text-sm font-semibold text-on-surface opacity-90">
            {activeDragData.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
