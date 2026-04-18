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
import { TaskWithRelations as Task, SavedView, CustomFieldDefinition, CustomFieldType } from '@/types'
import KanbanColumn from '@/components/board/KanbanColumn'
import KanbanCard from '@/components/board/KanbanCard'
import dynamic from 'next/dynamic'
import { cachedFetch, invalidateCache } from '@/lib/fetch-cache'

const CompletionReportModal = dynamic(() => import('@/components/tasks/CompletionReportModal'), { ssr: false })

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'bg-outline' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-energetic' },
  { id: 'in_review', label: 'In Review', color: 'bg-integrity' },
  { id: 'done', label: 'Done', color: 'bg-kindness' },
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
  [key: string]: string
}

interface Props {
  userId: string
  userRole: string
  teamId: string | null
  projects: { id: string; name: string }[]
  teamMembers: { id: string; name: string }[]
  initialSavedViews: SavedView[]
  customFields: Pick<CustomFieldDefinition, 'id' | 'name' | 'field_type' | 'options' | 'scope_type' | 'scope_id' | 'status'>[]
}

const MANAGER_ROLES = ['assistant_manager', 'manager', 'senior_manager', 'admin']

export default function BoardClient({ userId, userRole, teamId, projects, teamMembers, initialSavedViews, customFields }: Props) {
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
    // Custom field filters
    Object.entries(filters).forEach(([key, val]) => {
      if (key.startsWith('cf_') && val) params.set(key, val)
    })
    if (isManager) params.set('team', 'true')
    try {
      const d = await cachedFetch<{ tasks: Task[] }>(`/api/tasks?${params}&page_size=200`, { freshMs: 10000 })
      setTasks(d.tasks ?? [])
    } catch {
      // Keep previous data
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
      invalidateCache('/api/tasks')
      fetchTasks()
    } else {
      // Bust cache so next page load gets fresh data
      invalidateCache('/api/tasks')
    }
  }

  function applyView(view: SavedView) {
    const f = view.filters as Record<string, string>
    setFilters(prev => {
      const next = { ...prev }
      Object.entries(f).forEach(([k, v]) => { if (v !== undefined) next[k] = v })
      return next
    })
    setSavedViewsOpen(false)
  }

  function setFilter(key: string, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-surface">
      {/* Page header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-on-surface-variant">Workspace / Q4</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Board</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Saved Views */}
          <div className="relative" ref={savedViewsRef}>
            <button
              onClick={() => setSavedViewsOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-[0px_2px_8px_rgba(77,85,106,0.06)] text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">bookmark</span>
              Saved Views
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
            {savedViewsOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-[20px] rounded-2xl shadow-[0px_4px_24px_rgba(77,85,106,0.08)] py-2 z-50">
                {savedViews.length === 0 ? (
                  <p className="text-xs text-on-surface-variant px-4 py-3">No saved views yet</p>
                ) : (
                  savedViews.map(v => (
                    <button
                      key={v.id}
                      onClick={() => applyView(v)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-high text-left transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px] text-primary-container">
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
            style={{ background: 'linear-gradient(135deg, #2226F7 0%, #00D6A3 100%)' }}
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            Save View
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-6 pb-4">
        <div className="flex flex-wrap items-center gap-3 bg-white/80 backdrop-blur-[20px] rounded-2xl p-4 shadow-[0px_2px_8px_rgba(77,85,106,0.06)]">
          {/* Search */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface flex-1 min-w-[180px] max-w-[260px]">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">search</span>
            <input
              type="text"
              placeholder="Search tasks…"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              className="bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none flex-1"
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

          {/* Separator before custom fields */}
          {customFields.length > 0 && (
            <div className="h-6 w-px bg-outline-variant/20 mx-1" />
          )}

          {/* Dynamic Custom Field Filters */}
          {customFields.map(cf => (
            <CustomFieldFilter
              key={cf.id}
              field={cf}
              value={filters[`cf_${cf.id}` as keyof Filters] ?? ''}
              minValue={filters[`cf_${cf.id}_min` as keyof Filters] ?? ''}
              maxValue={filters[`cf_${cf.id}_max` as keyof Filters] ?? ''}
              onChange={(val) => setFilter(`cf_${cf.id}`, val)}
              onRangeChange={(min, max) => {
                setFilters(prev => ({
                  ...prev,
                  [`cf_${cf.id}_min`]: min,
                  [`cf_${cf.id}_max`]: max,
                }))
              }}
            />
          ))}

          {/* Clear filters */}
          {Object.values(filters).some(Boolean) && (
            <button
              onClick={() => {
                const cleared: Filters = { search: '', priority: '', task_type: '', task_nature: '', project_id: '', billable: '', assignee_id: '' }
                customFields.forEach(cf => {
                  cleared[`cf_${cf.id}`] = ''
                  cleared[`cf_${cf.id}_min`] = ''
                  cleared[`cf_${cf.id}_max`] = ''
                })
                setFilters(cleared)
              }}
              className="text-xs text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-full hover:bg-surface transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Active Filter Chips */}
        {Object.entries(filters).some(([_, v]) => Boolean(v)) && (
          <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-outline-variant/10">
            <span className="text-[10px] font-bold text-outline uppercase tracking-widest mr-2">Active Filters:</span>
            {filters.priority && (
              <FilterChip label={`Priority: ${filters.priority}`} onRemove={() => setFilter('priority', '')} />
            )}
            {filters.task_type && (
              <FilterChip label={`Type: ${filters.task_type}`} onRemove={() => setFilter('task_type', '')} />
            )}
            {filters.task_nature && (
              <FilterChip label={`Nature: ${filters.task_nature}`} onRemove={() => setFilter('task_nature', '')} />
            )}
            {filters.project_id && (
              <FilterChip label={`Project: ${projects.find(p => p.id === filters.project_id)?.name ?? filters.project_id}`} onRemove={() => setFilter('project_id', '')} />
            )}
            {filters.billable && (
              <FilterChip label={`Billable: ${filters.billable === 'true' ? 'Yes' : 'No'}`} onRemove={() => setFilter('billable', '')} />
            )}
            {filters.assignee_id && (
              <FilterChip label={`Assignee: ${teamMembers.find(m => m.id === filters.assignee_id)?.name ?? 'Selected'}`} onRemove={() => setFilter('assignee_id', '')} />
            )}
            {customFields.map(cf => {
              const val = filters[`cf_${cf.id}` as keyof Filters]
              const minVal = filters[`cf_${cf.id}_min` as keyof Filters]
              const maxVal = filters[`cf_${cf.id}_max` as keyof Filters]
              if (!val && !minVal && !maxVal) return null
              const display = val
                ? `${cf.name}: ${val}`
                : `${cf.name}: ${minVal || '*'} – ${maxVal || '*'}`
              return (
                <FilterChip
                  key={cf.id}
                  label={display}
                  onRemove={() => setFilters(prev => ({
                    ...prev,
                    [`cf_${cf.id}`]: '',
                    [`cf_${cf.id}_min`]: '',
                    [`cf_${cf.id}_max`]: '',
                  }))}
                />
              )
            })}
            <button
              onClick={() => {
                const cleared: Filters = { search: '', priority: '', task_type: '', task_nature: '', project_id: '', billable: '', assignee_id: '' }
                customFields.forEach(cf => {
                  cleared[`cf_${cf.id}`] = ''
                  cleared[`cf_${cf.id}_min`] = ''
                  cleared[`cf_${cf.id}_max`] = ''
                })
                setFilters(cleared)
              }}
              className="text-[10px] font-bold text-excitement/60 hover:text-excitement transition-colors px-2 underline underline-offset-2"
            >
              Clear all
            </button>
          </div>
        )}
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
        className="appearance-none pl-4 pr-8 py-2 rounded-full bg-surface text-sm text-on-surface-variant font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
      >
        {children}
      </select>
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/30 backdrop-blur-[20px]">
      <div className="bg-white rounded-2xl shadow-[0px_4px_24px_rgba(77,85,106,0.08)] w-full max-w-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-on-surface">Save Current View</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">close</span>
          </button>
        </div>
        {error && <p className="text-sm text-excitement mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="View name…"
            className="w-full px-4 py-2.5 rounded-full bg-surface text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
          />
          {isManager && (
            <div className="flex gap-2">
              {(['personal', 'shared'] as const).map(s => (
                <button
                  key={s} type="button"
                  onClick={() => setScope(s)}
                  className={`flex-1 py-2 rounded-full text-sm font-medium capitalize transition-colors ${scope === s ? 'text-on-primary' : 'bg-surface text-on-surface-variant hover:bg-surface-container-high'}`}
                  style={scope === s ? { background: 'linear-gradient(135deg, #2226F7 0%, #00D6A3 100%)' } : undefined}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-full bg-surface text-on-surface-variant text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-full text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg, #2226F7 0%, #00D6A3 100%)' }}>
              {loading ? 'Saving…' : 'Save View'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full cursor-default">
      <span className="text-[10px] font-semibold text-primary/80">{label}</span>
      <button onClick={onRemove} className="hover:text-excitement transition-colors">
        <span className="material-symbols-outlined text-[14px]">close</span>
      </button>
    </div>
  )
}

function CustomFieldFilter({ field, value, minValue, maxValue, onChange, onRangeChange }: {
  field: Pick<CustomFieldDefinition, 'id' | 'name' | 'field_type' | 'options'>
  value: string
  minValue: string
  maxValue: string
  onChange: (v: string) => void
  onRangeChange: (min: string, max: string) => void
}) {
  const fieldType = field.field_type as CustomFieldType

  // Text field — compact search input
  if (fieldType === 'text') {
    return (
      <div className="bg-surface-container-low px-3 py-2 rounded-full flex items-center gap-2">
        <span className="text-[10px] font-black text-outline uppercase tracking-tighter">{field.name}</span>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Search…"
          className="bg-transparent border-none focus:ring-0 p-0 text-xs w-20 placeholder:text-outline/50 outline-none"
        />
      </div>
    )
  }

  // Number field — min/max range
  if (fieldType === 'number') {
    return (
      <div className="bg-surface-container-low px-3 py-2 rounded-full flex items-center gap-2">
        <span className="text-[10px] font-black text-outline uppercase tracking-tighter">{field.name}</span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={minValue}
            onChange={e => onRangeChange(e.target.value, maxValue)}
            placeholder="Min"
            className="bg-white/50 border-none rounded-md px-1.5 py-0.5 text-[10px] w-12 focus:ring-1 focus:ring-primary-container outline-none"
          />
          <span className="text-[10px] text-outline opacity-50">–</span>
          <input
            type="number"
            value={maxValue}
            onChange={e => onRangeChange(minValue, e.target.value)}
            placeholder="Max"
            className="bg-white/50 border-none rounded-md px-1.5 py-0.5 text-[10px] w-12 focus:ring-1 focus:ring-primary-container outline-none"
          />
        </div>
      </div>
    )
  }

  // Date field — date range with native pickers
  if (fieldType === 'date') {
    return (
      <div className="bg-surface-container-low px-3 py-2 rounded-full flex items-center gap-2">
        <span className="text-[10px] font-black text-outline uppercase tracking-tighter">{field.name}</span>
        <span className="material-symbols-outlined text-[16px] text-outline">calendar_today</span>
        <input
          type="date"
          value={minValue}
          onChange={e => onRangeChange(e.target.value, maxValue)}
          className="bg-transparent border-none focus:ring-0 p-0 text-[10px] outline-none"
        />
        <span className="text-[10px] text-outline opacity-50">–</span>
        <input
          type="date"
          value={maxValue}
          onChange={e => onRangeChange(minValue, e.target.value)}
          className="bg-transparent border-none focus:ring-0 p-0 text-[10px] outline-none"
        />
      </div>
    )
  }

  // Dropdown field — select with options
  if (fieldType === 'dropdown') {
    const options = (field.options ?? []) as string[]
    return (
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="appearance-none bg-surface-container-low/80 backdrop-blur-md pl-3 pr-7 py-2 rounded-full text-xs font-bold text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary-container cursor-pointer"
        >
          <option value="">{field.name}: All</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">expand_more</span>
        </span>
      </div>
    )
  }

  // Checkbox field — 3-state toggle (Any / Yes / No)
  if (fieldType === 'checkbox') {
    return (
      <div className="flex items-center bg-surface-container-low rounded-full p-1">
        {['', 'true', 'false'].map(v => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`px-3 py-1 text-[10px] font-bold rounded-full transition-colors ${
              value === v
                ? 'bg-white shadow-sm text-primary'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            {v === '' ? 'Any' : v === 'true' ? 'Yes' : 'No'}
          </button>
        ))}
        <span className="ml-2 mr-3 text-[10px] font-black text-outline uppercase tracking-tighter">{field.name}</span>
      </div>
    )
  }

  return null
}
