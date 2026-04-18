'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { cachedFetch, invalidateCache } from '@/lib/fetch-cache'

const QuickTaskModal = dynamic(() => import('@/components/tasks/QuickTaskModal'), { ssr: false })

interface Project { id: string; name: string }

interface Task {
  id: string
  title: string
  status: string
  priority: string
  task_type: string
  task_nature: string
  billable: boolean
  due_date: string | null
  estimated_hours: number | null
  project: { id: string; name: string } | null
  assignee: { id: string; name: string; email: string } | null
  created_at: string
}

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'in_review', label: 'In Review' },
  { key: 'done', label: 'Done' },
]

const STATUS_DOT: Record<string, string> = {
  todo: 'bg-outline',
  in_progress: 'bg-energetic',
  in_review: 'bg-integrity',
  done: 'bg-kindness',
}

const STATUS_LABEL: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

const STATUS_ICON: Record<string, string> = {
  todo: 'radio_button_unchecked',
  in_progress: 'pending',
  in_review: 'visibility',
  done: 'check_circle',
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-excitement',
  medium: 'bg-energetic',
  low: 'bg-outline',
}

const PRIORITY_LABEL: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const KANBAN_COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'bg-outline' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-energetic' },
  { key: 'in_review', label: 'In Review', color: 'bg-integrity' },
  { key: 'done', label: 'Done', color: 'bg-kindness' },
]

type SortField = 'title' | 'status' | 'priority' | 'due_date' | 'assignee' | 'project' | 'task_type' | 'task_nature'
type SortDir = 'asc' | 'desc'
type ViewMode = 'list' | 'kanban'

interface ColumnDef {
  field: SortField
  label: string
  minWidth: number
  defaultWidth: number
}

const COLUMNS: ColumnDef[] = [
  { field: 'title', label: 'Task', minWidth: 120, defaultWidth: 999 },
  { field: 'status', label: 'Status', minWidth: 80, defaultWidth: 120 },
  { field: 'priority', label: 'Priority', minWidth: 80, defaultWidth: 100 },
  { field: 'task_type', label: 'Type', minWidth: 70, defaultWidth: 100 },
  { field: 'project', label: 'Project', minWidth: 80, defaultWidth: 120 },
  { field: 'due_date', label: 'Due Date', minWidth: 80, defaultWidth: 120 },
  { field: 'assignee', label: 'Assignee', minWidth: 80, defaultWidth: 100 },
]

/* ---- Dropdown filter component ---- */
function FilterDropdown({ label, icon, value, options, onChange }: {
  label: string
  icon: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
          value
            ? 'bg-primary text-white shadow-ambient-sm'
            : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <span className="material-symbols-outlined text-sm">{icon}</span>
        <span>{selected?.label || label}</span>
        <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>expand_more</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 min-w-[180px] bg-surface-container-lowest/80 backdrop-blur-[20px] rounded-[20px] shadow-ambient overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="py-2">
            <button
              onClick={() => { onChange(''); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors hover:bg-surface-container-high ${
                !value ? 'text-primary font-semibold' : 'text-on-surface-variant'
              }`}
            >
              All {label}s
            </button>
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors hover:bg-surface-container-high ${
                  value === opt.value ? 'text-primary font-semibold' : 'text-on-surface-variant'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---- Column header dropdown ---- */
function ColumnHeaderDropdown({ column, sortField, sortDir, onSort, onHide, onResetWidth }: {
  column: ColumnDef
  sortField: SortField
  sortDir: SortDir
  onSort: (field: SortField, dir: SortDir) => void
  onHide: (field: SortField) => void
  onResetWidth: (field: SortField) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        className={`material-symbols-outlined text-xs transition-all duration-150 ${
          open ? 'text-primary opacity-100' : 'opacity-0 group-hover:opacity-60'
        } hover:text-primary`}
      >
        more_vert
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 min-w-[160px] bg-surface-container-lowest/90 backdrop-blur-[20px] rounded-[16px] shadow-ambient overflow-hidden z-50">
          <div className="py-1.5">
            <button
              onClick={() => { onSort(column.field, 'asc'); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors hover:bg-surface-container-high ${
                sortField === column.field && sortDir === 'asc' ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-sm">arrow_upward</span>
              Sort Ascending
            </button>
            <button
              onClick={() => { onSort(column.field, 'desc'); setOpen(false) }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors hover:bg-surface-container-high ${
                sortField === column.field && sortDir === 'desc' ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-sm">arrow_downward</span>
              Sort Descending
            </button>
            <div className="mx-3 my-1 border-t border-outline-variant/15" />
            <button
              onClick={() => { onResetWidth(column.field); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-sm">width</span>
              Reset Width
            </button>
            {column.field !== 'title' && (
              <button
                onClick={() => { onHide(column.field); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-sm">visibility_off</span>
                Hide Column
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---- Resizable column handle ---- */
function ResizeHandle({ onResize }: { onResize: (delta: number) => void }) {
  const startX = useRef(0)
  const dragging = useRef(false)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    startX.current = e.clientX
    dragging.current = true

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const delta = ev.clientX - startX.current
      startX.current = ev.clientX
      onResize(delta)
    }

    const onMouseUp = () => {
      dragging.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [onResize])

  return (
    <div
      onMouseDown={onMouseDown}
      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 group/handle hover:bg-primary/20 transition-colors"
    >
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-outline/0 group-hover/handle:bg-primary/40 transition-colors" />
    </div>
  )
}

interface TasksClientProps {
  userId: string
  userRole: string
  projects: Project[]
}

export default function TasksClient({ userId, userRole, projects }: TasksClientProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterNature, setFilterNature] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterBillable, setFilterBillable] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [sortField, setSortField] = useState<SortField>('created_at' as SortField)
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [hiddenColumns, setHiddenColumns] = useState<Set<SortField>>(new Set())

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeStatus) params.set('status', activeStatus)
    if (filterPriority) params.set('priority', filterPriority)
    if (filterType) params.set('task_type', filterType)
    if (filterNature) params.set('task_nature', filterNature)
    if (filterProject) params.set('project_id', filterProject)
    if (filterBillable) params.set('billable', 'true')

    try {
      const data = await cachedFetch<{ tasks: Task[] }>(`/api/tasks?${params}`)
      setTasks(data.tasks ?? [])
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    }
    setLoading(false)
  }, [activeStatus, filterPriority, filterType, filterNature, filterProject, filterBillable])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'done') return false
    return new Date(task.due_date) < new Date()
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  const handleSort = (field: SortField, dir?: SortDir) => {
    if (dir) {
      setSortField(field)
      setSortDir(dir)
    } else if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    switch (sortField) {
      case 'title': return dir * a.title.localeCompare(b.title)
      case 'status': return dir * (a.status).localeCompare(b.status)
      case 'priority': {
        const order: Record<string, number> = { high: 3, medium: 2, low: 1 }
        return dir * ((order[a.priority] ?? 0) - (order[b.priority] ?? 0))
      }
      case 'due_date': {
        const da = a.due_date ? new Date(a.due_date).getTime() : 0
        const db = b.due_date ? new Date(b.due_date).getTime() : 0
        return dir * (da - db)
      }
      case 'assignee': return dir * (a.assignee?.name ?? '').localeCompare(b.assignee?.name ?? '')
      case 'project': return dir * (a.project?.name ?? '').localeCompare(b.project?.name ?? '')
      case 'task_type': return dir * a.task_type.localeCompare(b.task_type)
      case 'task_nature': return dir * a.task_nature.localeCompare(b.task_nature)
      default: return 0
    }
  })

  const toggleSelect = (id: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedTasks.size === sortedTasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(sortedTasks.map(t => t.id)))
    }
  }

  const activeFilterCount = [filterPriority, filterType, filterNature, filterProject, filterBillable ? 'x' : ''].filter(Boolean).length

  const visibleColumns = useMemo(() => COLUMNS.filter(c => !hiddenColumns.has(c.field)), [hiddenColumns])

  const getColWidth = (field: string) => columnWidths[field]
  const resizeColumn = useCallback((field: string, delta: number) => {
    setColumnWidths(prev => {
      const col = COLUMNS.find(c => c.field === field)
      const current = prev[field] ?? col?.defaultWidth ?? 120
      const min = col?.minWidth ?? 60
      return { ...prev, [field]: Math.max(min, current + delta) }
    })
  }, [])
  const resetColumnWidth = useCallback((field: SortField) => {
    setColumnWidths(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])
  const hideColumn = useCallback((field: SortField) => {
    setHiddenColumns(prev => new Set(prev).add(field))
  }, [])
  const showColumn = useCallback((field: SortField) => {
    setHiddenColumns(prev => {
      const next = new Set(prev)
      next.delete(field)
      return next
    })
  }, [])

  // Build grid template from visible columns
  const gridTemplate = useMemo(() => {
    const cols = visibleColumns.map(c => {
      if (c.field === 'title') {
        const w = getColWidth(c.field)
        return w ? `${w}px` : 'minmax(0,2fr)'
      }
      const w = getColWidth(c.field)
      return w ? `${w}px` : `${c.defaultWidth}px`
    })
    return `40px ${cols.join(' ')} 40px`
  }, [visibleColumns, columnWidths]) // eslint-disable-line react-hooks/exhaustive-deps

  // Kanban data grouped by status
  const kanbanData = useMemo(() => {
    const map: Record<string, Task[]> = {}
    for (const col of KANBAN_COLUMNS) map[col.key] = []
    for (const t of sortedTasks) {
      if (map[t.status]) map[t.status].push(t)
    }
    return map
  }, [sortedTasks])

  // ---- Render helpers ----
  const renderCellContent = (task: Task, field: SortField) => {
    switch (field) {
      case 'title':
        return (
          <div className="min-w-0 flex items-center gap-2.5">
            <div className={`w-1 h-6 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] ?? 'bg-outline'}`} />
            <p className={`text-sm font-medium text-on-surface truncate group-hover:text-primary transition-colors ${task.status === 'done' ? 'line-through text-outline' : ''}`}>
              {task.title}
            </p>
          </div>
        )
      case 'status':
        return (
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[task.status] ?? 'bg-outline'}`} />
            <span className="text-xs text-on-surface-variant font-medium truncate">{STATUS_LABEL[task.status] ?? task.status}</span>
          </div>
        )
      case 'priority':
        return (
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] ?? 'bg-outline'}`} />
            <span className="text-xs text-on-surface-variant font-medium">{PRIORITY_LABEL[task.priority] ?? task.priority}</span>
          </div>
        )
      case 'task_type':
        return <span className="text-xs text-on-surface-variant font-medium capitalize truncate">{task.task_type === 'adhoc' ? 'Ad Hoc' : task.task_type}</span>
      case 'task_nature':
        return <span className="text-xs text-on-surface-variant font-medium capitalize truncate">{task.task_nature}</span>
      case 'project':
        return <span className="text-xs text-on-surface-variant font-medium truncate">{task.project?.name ?? '—'}</span>
      case 'due_date':
        return (
          <span className={`text-xs font-medium flex items-center gap-1 ${isOverdue(task) ? 'text-error' : task.due_date ? 'text-on-surface-variant' : 'text-outline/40'}`}>
            {task.due_date && <span className="material-symbols-outlined text-xs">event</span>}
            {formatDate(task.due_date)}
          </span>
        )
      case 'assignee':
        return task.assignee ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-on-primary-container">{task.assignee.name.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-xs text-on-surface-variant font-medium truncate hidden xl:block">{task.assignee.name.split(' ')[0]}</span>
          </div>
        ) : <span className="text-xs text-outline/40">—</span>
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">My Tasks</h1>
          <p className="text-sm text-outline mt-0.5">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you
            {selectedTasks.size > 0 && (
              <span className="ml-2 text-primary font-semibold">· {selectedTasks.size} selected</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View switcher */}
          <div className="hidden sm:flex items-center bg-surface-container-lowest rounded-full p-1 shadow-ambient-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                viewMode === 'list'
                  ? 'text-white shadow-ambient-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              style={viewMode === 'list' ? { background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' } : undefined}
            >
              <span className="material-symbols-outlined text-sm">view_list</span>
              List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                viewMode === 'kanban'
                  ? 'text-white shadow-ambient-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              style={viewMode === 'kanban' ? { background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' } : undefined}
            >
              <span className="material-symbols-outlined text-sm">view_kanban</span>
              Board
            </button>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-ambient-sm transition-all duration-200 hover:opacity-90 hover:shadow-ambient hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
          >
            <span className="material-symbols-outlined text-lg">add</span>
            New Task
          </button>
        </div>
      </div>

      {/* Status tabs + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
        {/* Status tabs — only show in list view */}
        {viewMode === 'list' && (
          <div className="flex gap-0.5 bg-surface-container-lowest rounded-full p-1 shadow-ambient-sm">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveStatus(tab.key)}
                className={`px-4 py-2 text-xs font-semibold rounded-full transition-all duration-200 ${
                  activeStatus === tab.key
                    ? 'text-white shadow-ambient-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
                style={
                  activeStatus === tab.key
                    ? { background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }
                    : undefined
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Mobile view toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={() => setViewMode(v => v === 'list' ? 'kanban' : 'list')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-surface-container-lowest text-on-surface-variant shadow-ambient-sm"
          >
            <span className="material-symbols-outlined text-sm">{viewMode === 'list' ? 'view_kanban' : 'view_list'}</span>
            {viewMode === 'list' ? 'Board' : 'List'}
          </button>
        </div>

        {/* Filter chips row */}
        <div className="flex items-center gap-2 flex-wrap">
          <FilterDropdown
            label="Priority"
            icon="flag"
            value={filterPriority}
            options={[
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
            onChange={setFilterPriority}
          />
          <FilterDropdown
            label="Type"
            icon="category"
            value={filterType}
            options={[
              { value: 'planned', label: 'Planned' },
              { value: 'adhoc', label: 'Ad Hoc' },
            ]}
            onChange={setFilterType}
          />
          <FilterDropdown
            label="Nature"
            icon="nature"
            value={filterNature}
            options={[
              { value: 'core', label: 'Core' },
              { value: 'supporting', label: 'Supporting' },
            ]}
            onChange={setFilterNature}
          />
          <FilterDropdown
            label="Project"
            icon="folder"
            value={filterProject}
            options={projects.map(p => ({ value: p.id, label: p.name }))}
            onChange={setFilterProject}
          />
          <button
            onClick={() => setFilterBillable(b => !b)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
              filterBillable
                ? 'bg-primary text-white shadow-ambient-sm'
                : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-sm">attach_money</span>
            Billable
          </button>

          {/* Hidden columns restore */}
          {hiddenColumns.size > 0 && (
            <div className="flex items-center gap-1">
              {Array.from(hiddenColumns).map(field => {
                const col = COLUMNS.find(c => c.field === field)
                return (
                  <button
                    key={field}
                    onClick={() => showColumn(field)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-semibold bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    title={`Show ${col?.label}`}
                  >
                    <span className="material-symbols-outlined text-xs">visibility</span>
                    {col?.label}
                  </button>
                )
              })}
            </div>
          )}

          {activeFilterCount > 0 && (
            <button
              onClick={() => { setFilterPriority(''); setFilterType(''); setFilterNature(''); setFilterProject(''); setFilterBillable(false) }}
              className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold text-outline hover:text-on-surface hover:bg-surface-container-high transition-all duration-200"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Clear ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* ═══════════ LIST VIEW ═══════════ */}
      {viewMode === 'list' && (
        <div className="flex-1 bg-surface-container-lowest rounded-[24px] shadow-ambient overflow-hidden flex flex-col min-h-0">
          {/* Column headers — desktop */}
          <div className="hidden md:grid items-center px-4 py-3 bg-surface-container-low/50 shrink-0 gap-x-0" style={{ gridTemplateColumns: gridTemplate }}>
            <div className="flex items-center justify-center">
              <button
                onClick={toggleSelectAll}
                className="w-5 h-5 rounded-md flex items-center justify-center transition-colors hover:bg-surface-container-high"
              >
                <span className={`material-symbols-outlined text-base ${
                  selectedTasks.size === sortedTasks.length && sortedTasks.length > 0 ? 'text-primary' : 'text-outline/40'
                }`}
                  style={selectedTasks.size === sortedTasks.length && sortedTasks.length > 0 ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {selectedTasks.size === sortedTasks.length && sortedTasks.length > 0 ? 'check_box' : 'check_box_outline_blank'}
                </span>
              </button>
            </div>
            {visibleColumns.map((col) => (
              <div key={col.field} className="relative group flex items-center gap-1 pr-2">
                <button
                  onClick={() => handleSort(col.field)}
                  className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  {col.label}
                  <span className={`material-symbols-outlined text-xs transition-all duration-200 ${
                    sortField === col.field ? 'text-primary opacity-100' : 'opacity-0 group-hover:opacity-40'
                  } ${sortField === col.field && sortDir === 'desc' ? 'rotate-180' : ''}`}>
                    arrow_upward
                  </span>
                </button>
                <ColumnHeaderDropdown
                  column={col}
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  onHide={hideColumn}
                  onResetWidth={resetColumnWidth}
                />
                {col.field !== 'title' && (
                  <ResizeHandle onResize={(delta) => resizeColumn(col.field, delta)} />
                )}
              </div>
            ))}
            <div />
          </div>

          {/* Mobile header */}
          <div className="flex md:hidden items-center justify-between px-4 py-3 bg-surface-container-low/50 shrink-0">
            <div className="flex items-center gap-2">
              <button onClick={toggleSelectAll} className="w-5 h-5 rounded-md flex items-center justify-center">
                <span className={`material-symbols-outlined text-base ${
                  selectedTasks.size === sortedTasks.length && sortedTasks.length > 0 ? 'text-primary' : 'text-outline/40'
                }`}
                  style={selectedTasks.size === sortedTasks.length && sortedTasks.length > 0 ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {selectedTasks.size === sortedTasks.length && sortedTasks.length > 0 ? 'check_box' : 'check_box_outline_blank'}
                </span>
              </button>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">{sortedTasks.length} Tasks</span>
            </div>
            <button onClick={() => handleSort(sortField)} className="flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant">
              Sort
              <span className={`material-symbols-outlined text-xs ${sortDir === 'desc' ? 'rotate-180' : ''}`}>arrow_upward</span>
            </button>
          </div>

          {/* Scrollable rows */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {loading ? (
              <div className="py-16 text-center text-outline">
                <span className="material-symbols-outlined text-3xl animate-spin block mb-2">progress_activity</span>
                Loading tasks…
              </div>
            ) : sortedTasks.length === 0 ? (
              <div className="py-16 text-center">
                <span className="material-symbols-outlined text-4xl text-outline/40 block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                <p className="text-sm text-outline">No tasks found</p>
                <button onClick={() => setModalOpen(true)} className="mt-4 text-sm font-semibold text-primary hover:underline">
                  Create your first task →
                </button>
              </div>
            ) : (
              <div>
                {sortedTasks.map((task, idx) => (
                  <div key={task.id}>
                    {/* Desktop row */}
                    <div
                      onClick={() => router.push(`/tasks/${task.id}`)}
                      className={`hidden md:grid items-center px-4 py-3 gap-x-0 cursor-pointer transition-all duration-150 group ${
                        selectedTasks.has(task.id)
                          ? 'bg-primary/[0.04]'
                          : idx % 2 === 0
                            ? 'bg-transparent hover:bg-surface-container-high/60'
                            : 'bg-surface-container-low/30 hover:bg-surface-container-high/60'
                      }`}
                      style={{ gridTemplateColumns: gridTemplate }}
                    >
                      <div className="flex items-center justify-center" onClick={e => { e.stopPropagation(); toggleSelect(task.id) }}>
                        <span className={`material-symbols-outlined text-base transition-colors ${
                          selectedTasks.has(task.id) ? 'text-primary' : 'text-outline/30 group-hover:text-outline/60'
                        }`}
                          style={selectedTasks.has(task.id) ? { fontVariationSettings: "'FILL' 1" } : undefined}
                        >
                          {selectedTasks.has(task.id) ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                      </div>
                      {visibleColumns.map(col => (
                        <div key={col.field} className="overflow-hidden pr-2">
                          {renderCellContent(task, col.field)}
                        </div>
                      ))}
                      <span className="material-symbols-outlined text-base text-outline/30 group-hover:text-outline transition-colors">chevron_right</span>
                    </div>

                    {/* Mobile card row */}
                    <div
                      onClick={() => router.push(`/tasks/${task.id}`)}
                      className={`flex md:hidden items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-150 group ${
                        selectedTasks.has(task.id)
                          ? 'bg-primary/[0.04]'
                          : idx % 2 === 0
                            ? 'bg-transparent active:bg-surface-container-high/60'
                            : 'bg-surface-container-low/30 active:bg-surface-container-high/60'
                      }`}
                    >
                      <div className="pt-0.5" onClick={e => { e.stopPropagation(); toggleSelect(task.id) }}>
                        <span className={`material-symbols-outlined text-base ${selectedTasks.has(task.id) ? 'text-primary' : 'text-outline/30'}`}
                          style={selectedTasks.has(task.id) ? { fontVariationSettings: "'FILL' 1" } : undefined}
                        >
                          {selectedTasks.has(task.id) ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-1 h-4 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] ?? 'bg-outline'}`} />
                          <p className={`text-sm font-medium text-on-surface truncate ${task.status === 'done' ? 'line-through text-outline' : ''}`}>{task.title}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[task.status]}`} />
                            <span className="text-[11px] text-on-surface-variant">{STATUS_LABEL[task.status]}</span>
                          </div>
                          {task.due_date && <span className={`text-[11px] ${isOverdue(task) ? 'text-error' : 'text-outline'}`}>{formatDate(task.due_date)}</span>}
                          {task.project && <span className="text-[11px] text-outline">{task.project.name}</span>}
                        </div>
                      </div>
                      {task.assignee && (
                        <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-on-primary-container">{task.assignee.name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <span className="material-symbols-outlined text-base text-outline/30 pt-0.5">chevron_right</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Table footer */}
          {!loading && sortedTasks.length > 0 && (
            <div className="px-4 py-2.5 bg-surface-container-low/50 flex items-center justify-between text-[11px] text-outline font-medium shrink-0">
              <span>Showing {sortedTasks.length} of {tasks.length} tasks</span>
              <div className="flex items-center gap-3">
                {selectedTasks.size > 0 && <span className="text-primary font-semibold">{selectedTasks.size} selected</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ KANBAN VIEW ═══════════ */}
      {viewMode === 'kanban' && (
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
          {loading ? (
            <div className="py-16 text-center text-outline">
              <span className="material-symbols-outlined text-3xl animate-spin block mb-2">progress_activity</span>
              Loading tasks…
            </div>
          ) : (
            <div className="flex gap-4 h-full pb-2 min-w-min">
              {KANBAN_COLUMNS.map(col => {
                const columnTasks = kanbanData[col.key] ?? []
                return (
                  <div key={col.key} className="flex flex-col w-72 sm:w-80 shrink-0">
                    {/* Column header */}
                    <div className="flex items-center gap-2.5 px-3 py-3 mb-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                      <span className="text-sm font-semibold text-on-surface">{col.label}</span>
                      <span className="text-xs font-medium text-outline bg-surface-container rounded-full px-2 py-0.5">
                        {columnTasks.length}
                      </span>
                    </div>

                    {/* Cards container */}
                    <div className="flex-1 overflow-y-auto space-y-2 px-1 pb-4">
                      {columnTasks.length === 0 ? (
                        <div className="rounded-[20px] bg-surface-container-lowest/60 py-8 text-center">
                          <span className="material-symbols-outlined text-2xl text-outline/30 block mb-1">inbox</span>
                          <p className="text-xs text-outline/60">No tasks</p>
                        </div>
                      ) : (
                        columnTasks.map(task => (
                          <div
                            key={task.id}
                            onClick={() => router.push(`/tasks/${task.id}`)}
                            className="group bg-surface-container-lowest rounded-[20px] p-4 shadow-ambient-sm hover:shadow-ambient cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                          >
                            {/* Priority + title */}
                            <div className="flex items-start gap-2 mb-3">
                              <div className={`w-1 h-5 rounded-full shrink-0 mt-0.5 ${PRIORITY_DOT[task.priority] ?? 'bg-outline'}`} />
                              <p className={`text-sm font-medium text-on-surface leading-snug group-hover:text-primary transition-colors ${task.status === 'done' ? 'line-through text-outline' : ''}`}>
                                {task.title}
                              </p>
                            </div>

                            {/* Metadata row */}
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                task.priority === 'high' ? 'bg-excitement-10 text-excitement' :
                                task.priority === 'medium' ? 'bg-energetic-10 text-energetic' :
                                'bg-surface-container text-on-surface-variant'
                              }`}>
                                {PRIORITY_LABEL[task.priority]}
                              </span>
                              <span className="text-[10px] text-on-surface-variant font-medium capitalize">
                                {task.task_type === 'adhoc' ? 'Ad Hoc' : task.task_type}
                              </span>
                              {task.billable && (
                                <span className="material-symbols-outlined text-xs text-kindness" title="Billable">attach_money</span>
                              )}
                            </div>

                            {/* Footer: project, date, assignee */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {task.project && (
                                  <span className="text-[10px] text-outline truncate">{task.project.name}</span>
                                )}
                                {task.due_date && (
                                  <span className={`flex items-center gap-0.5 text-[10px] font-medium shrink-0 ${isOverdue(task) ? 'text-error' : 'text-outline'}`}>
                                    <span className="material-symbols-outlined text-xs">event</span>
                                    {formatDate(task.due_date)}
                                  </span>
                                )}
                              </div>
                              {task.assignee && (
                                <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center shrink-0 ml-2">
                                  <span className="text-[10px] font-bold text-on-primary-container">{task.assignee.name.charAt(0).toUpperCase()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <QuickTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => { invalidateCache('/api/tasks'); fetchTasks() }}
        projects={projects}
        currentUserId={userId}
        userRole={userRole}
      />
    </div>
  )
}
