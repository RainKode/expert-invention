'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { TaskWithRelations as Task, SavedView } from '@/types'
import KanbanColumn from '@/components/board/KanbanColumn'
import KanbanCard from '@/components/board/KanbanCard'
import CompletionReportModal from '@/components/tasks/CompletionReportModal'

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'bg-slate-400' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'in_review', label: 'In Review', color: 'bg-purple-500' },
  { id: 'done', label: 'Done', color: 'bg-green-500' },
] as const

type ColumnId = typeof COLUMNS[number]['id']

interface Filters {
  search: string
  priority: string
  task_type: string
  task_nature: string
  project_id: string
  billable: string
  assignee_id: string
}

interface Props {
  userId: string
  userRole: string
  teamId: string | null
  projects: { id: string; name: string }[]
  teamMembers: { id: string; name: string }[]
  initialSavedViews: SavedView[]
}

const MANAGER_ROLES = ['assistant_manager', 'manager', 'senior_manager', 'admin']

export default function BoardClient({ userId, userRole, teamId, projects, teamMembers, initialSavedViews }: Props) {
  const isManager = MANAGER_ROLES.includes(userRole)

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [pendingStatusMove, setPendingStatusMove] = useState<{ taskId: string; newStatus: string } | null>(null)
  const [completionOpen, setCompletionOpen] = useState(false)

  const [savedViews, setSavedViews] = useState<SavedView[]>(initialSavedViews)
  const [savedViewsOpen, setSavedViewsOpen] = useState(false)
  const [saveViewOpen, setSaveViewOpen] = useState(false)
  const savedViewsRef = useRef<HTMLDivElement>(null)

  const [filters, setFilters] = useState<Filters>({
    search: '',
    priority: '',
    task_type: '',
    task_nature: '',
    project_id: '',
    billable: '',
    assignee_id: '',
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.task_type) params.set('task_type', filters.task_type)
    if (filters.task_nature) params.set('task_nature', filters.task_nature)
    if (filters.project_id) params.set('project_id', filters.project_id)
    if (filters.billable) params.set('billable', filters.billable)
    if (filters.assignee_id) params.set('assignee_id', filters.assignee_id)
    if (isManager) params.set('team', 'true')
    const res = await fetch(`/api/tasks?${params}&page_size=200`)
    if (res.ok) {
      const d = await res.json()
      setTasks(d.tasks ?? [])
    }
    setLoading(false)
  }, [filters])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  // Close saved views dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (savedViewsRef.current && !savedViewsRef.current.contains(e.target as Node)) {
        setSavedViewsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function getColumnTasks(colId: ColumnId) {
    return tasks.filter(t => t.status === colId)
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const targetStatus = over.id as string

    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === targetStatus) return

    // Validate transition
    const VALID_NEXT: Record<string, string[]> = {
      todo: ['in_progress'],
      in_progress: ['in_review'],
      in_review: ['done', 'in_progress'],
      done: [],
    }
    const valid = VALID_NEXT[task.status] ?? []
    const isReviewer = task.reviewer?.id === userId
    const canMoveToDone = targetStatus === 'done' && (isReviewer || isManager)

    if (!valid.includes(targetStatus) && !canMoveToDone) return

    // If moving to in_review and no completion report: open modal
    if (targetStatus === 'in_review' && !task.completion_report_text) {
      setPendingStatusMove({ taskId, newStatus: targetStatus })
      setCompletionOpen(true)
      return
    }

    await applyStatusMove(taskId, targetStatus)
  }

  async function applyStatusMove(taskId: string, newStatus: string) {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as import('@/types').TaskStatus } : t))
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) {
      // Revert
      fetchTasks()
    }
  }

  function applyView(view: SavedView) {
    const f = view.filters as Partial<Filters>
    setFilters(prev => ({ ...prev, ...f }))
    setSavedViewsOpen(false)
  }

  function setFilter(key: keyof Filters, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#f7f9fb]">
      {/* Page header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-[#434655]">Workspace / Q4</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#191c1e]">Board</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Saved Views */}
          <div className="relative" ref={savedViewsRef}>
            <button
              onClick={() => setSavedViewsOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-[0_2px_8px_rgba(77,85,106,0.08)] text-sm font-medium text-[#434655] hover:bg-[#f7f9fb] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">bookmark</span>
              Saved Views
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
            {savedViewsOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-[20px] rounded-2xl shadow-[0_24px_48px_rgba(77,85,106,0.12)] py-2 z-50">
                {savedViews.length === 0 ? (
                  <p className="text-xs text-[#434655] px-4 py-3">No saved views yet</p>
                ) : (
                  savedViews.map(v => (
                    <button
                      key={v.id}
                      onClick={() => applyView(v)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#191c1e] hover:bg-[#f7f9fb] text-left transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px] text-[#4d556a]">
                        {v.scope === 'shared' ? 'group' : 'person'}
                      </span>
                      {v.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setSaveViewOpen(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-white font-medium text-sm shadow-sm"
            style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            Save View
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-6 pb-4">
        <div className="flex flex-wrap items-center gap-3 bg-white/80 backdrop-blur-[20px] rounded-2xl p-4 shadow-[0_4px_24px_rgba(77,85,106,0.06)]">
          {/* Search */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#f7f9fb] flex-1 min-w-[180px] max-w-[260px]">
            <span className="material-symbols-outlined text-[16px] text-[#434655]">search</span>
            <input
              type="text"
              placeholder="Search tasks…"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              className="bg-transparent text-sm text-[#191c1e] placeholder:text-[#434655]/50 outline-none flex-1"
            />
          </div>
          {/* Priority */}
          <FilterSelect label="Priority" value={filters.priority} onChange={v => setFilter('priority', v)}>
            <option value="">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </FilterSelect>
          {/* Type */}
          <FilterSelect label="Type" value={filters.task_type} onChange={v => setFilter('task_type', v)}>
            <option value="">All</option>
            <option value="planned">Planned</option>
            <option value="adhoc">Ad Hoc</option>
          </FilterSelect>
          {/* Nature */}
          <FilterSelect label="Nature" value={filters.task_nature} onChange={v => setFilter('task_nature', v)}>
            <option value="">All</option>
            <option value="core">Core</option>
            <option value="supporting">Supporting</option>
          </FilterSelect>
          {/* Project */}
          <FilterSelect label="Project" value={filters.project_id} onChange={v => setFilter('project_id', v)}>
            <option value="">All</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </FilterSelect>
          {/* Billable */}
          <FilterSelect label="Billable" value={filters.billable} onChange={v => setFilter('billable', v)}>
            <option value="">All</option>
            <option value="true">Billable</option>
            <option value="false">Non-billable</option>
          </FilterSelect>
          {/* Assignee (managers only) */}
          {isManager && (
            <FilterSelect label="Assignee" value={filters.assignee_id} onChange={v => setFilter('assignee_id', v)}>
              <option value="">All</option>
              {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </FilterSelect>
          )}
          {/* Clear filters */}
          {Object.values(filters).some(Boolean) && (
            <button
              onClick={() => setFilters({ search: '', priority: '', task_type: '', task_nature: '', project_id: '', billable: '', assignee_id: '' })}
              className="text-xs text-[#434655] hover:text-[#191c1e] px-3 py-2 rounded-full hover:bg-[#f7f9fb] transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 px-6 pb-6 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 min-w-[800px]">
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                label={col.label}
                color={col.color}
                tasks={getColumnTasks(col.id)}
                loading={loading}
                userId={userId}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? (
              <KanbanCard task={activeTask} isDragging userId={userId} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Completion report modal (triggered by drag) */}
      {pendingStatusMove && (
        <CompletionReportModal
          open={completionOpen}
          onClose={() => { setCompletionOpen(false); setPendingStatusMove(null) }}
          onSubmitted={async () => {
            setCompletionOpen(false)
            if (pendingStatusMove) {
              await applyStatusMove(pendingStatusMove.taskId, pendingStatusMove.newStatus)
              setPendingStatusMove(null)
            }
          }}
          taskId={pendingStatusMove.taskId}
          taskTitle={tasks.find(t => t.id === pendingStatusMove.taskId)?.title ?? ''}
        />
      )}

      {/* Save View modal */}
      {saveViewOpen && (
        <SaveViewModal
          isManager={isManager}
          filters={filters}
          onClose={() => setSaveViewOpen(false)}
          onSaved={view => { setSavedViews(prev => [...prev, view]); setSaveViewOpen(false) }}
        />
      )}
    </div>
  )
}

function FilterSelect({ label, value, onChange, children }: {
  label: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-4 pr-8 py-2 rounded-full bg-[#f7f9fb] text-sm text-[#434655] font-medium focus:outline-none focus:ring-2 focus:ring-[#4d556a]/20 cursor-pointer"
      >
        {children}
      </select>
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#434655]">
        <span className="material-symbols-outlined text-[14px]">expand_more</span>
      </span>
    </div>
  )
}

function SaveViewModal({ isManager, filters, onClose, onSaved }: {
  isManager: boolean
  filters: Filters
  onClose: () => void
  onSaved: (v: SavedView) => void
}) {
  const [name, setName] = useState('')
  const [scope, setScope] = useState<'personal' | 'shared'>('personal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/saved-views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, filters, scope }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Failed to save'); setLoading(false); return }
    onSaved(json.view)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(77,85,106,0.3)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-[0_24px_48px_rgba(77,85,106,0.12)] w-full max-w-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#191c1e]">Save Current View</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#f7f9fb]">
            <span className="material-symbols-outlined text-[18px] text-[#434655]">close</span>
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="View name…"
            className="w-full px-4 py-2.5 rounded-full bg-[#f7f9fb] text-sm text-[#191c1e] outline-none focus:ring-2 focus:ring-[#4d556a]/30"
          />
          {isManager && (
            <div className="flex gap-2">
              {(['personal', 'shared'] as const).map(s => (
                <button
                  key={s} type="button"
                  onClick={() => setScope(s)}
                  className={`flex-1 py-2 rounded-full text-sm font-medium capitalize transition-colors ${scope === s ? 'bg-[#4d556a] text-white' : 'bg-[#f7f9fb] text-[#434655] hover:bg-[#eef0f4]'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-full bg-[#f7f9fb] text-[#434655] text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-full text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}>
              {loading ? 'Saving…' : 'Save View'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
