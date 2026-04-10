'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import QuickTaskModal from '@/components/tasks/QuickTaskModal'

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

const STATUS_BADGE: Record<string, string> = {
  todo: 'bg-surface-container text-on-surface-variant',
  in_progress: 'bg-secondary-container text-on-secondary-container',
  in_review: 'bg-tertiary-container text-on-tertiary-container',
  done: 'bg-primary-container text-on-primary-container',
}

const STATUS_LABEL: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

const PRIORITY_BAR: Record<string, string> = {
  high: 'bg-error',
  medium: 'bg-tertiary',
  low: 'bg-outline',
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

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeStatus) params.set('status', activeStatus)
    if (filterPriority) params.set('priority', filterPriority)
    if (filterType) params.set('task_type', filterType)
    if (filterNature) params.set('task_nature', filterNature)
    if (filterProject) params.set('project_id', filterProject)
    if (filterBillable) params.set('billable', 'true')

    const res = await fetch(`/api/tasks?${params}`)
    if (res.ok) {
      const data = await res.json()
      setTasks(data.tasks ?? [])
    }
    setLoading(false)
  }, [activeStatus, filterPriority, filterType, filterNature, filterProject, filterBillable])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'done') return false
    return new Date(task.due_date) < new Date()
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">My Tasks</h1>
          <p className="text-sm text-outline mt-0.5">Tasks assigned to you.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-ambient-sm transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Task
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveStatus(tab.key)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors relative ${
              activeStatus === tab.key
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab.label}
            {activeStatus === tab.key && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-1.5 bg-surface-container-low rounded-xl text-xs font-semibold text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-1.5 bg-surface-container-low rounded-xl text-xs font-semibold text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Type</option>
          <option value="planned">Planned</option>
          <option value="adhoc">Ad Hoc</option>
        </select>

        <select
          value={filterNature}
          onChange={e => setFilterNature(e.target.value)}
          className="px-3 py-1.5 bg-surface-container-low rounded-xl text-xs font-semibold text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Nature</option>
          <option value="core">Core</option>
          <option value="supporting">Supporting</option>
        </select>

        <select
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
          className="px-3 py-1.5 bg-surface-container-low rounded-xl text-xs font-semibold text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <button
          onClick={() => setFilterBillable(b => !b)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filterBillable
              ? 'bg-primary text-white'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-sm">attach_money</span>
          Billable
        </button>

        {(filterPriority || filterType || filterNature || filterProject || filterBillable) && (
          <button
            onClick={() => { setFilterPriority(''); setFilterType(''); setFilterNature(''); setFilterProject(''); setFilterBillable(false) }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-outline hover:text-on-surface transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="py-16 text-center text-outline">
          <span className="material-symbols-outlined text-3xl animate-spin block mb-2">progress_activity</span>
          Loading tasks…
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-16 text-center">
          <span className="material-symbols-outlined text-4xl text-outline/40 block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
          <p className="text-sm text-outline">No tasks found</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 text-sm font-semibold text-primary hover:underline"
          >
            Create your first task →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <button
              key={task.id}
              onClick={() => router.push(`/tasks/${task.id}`)}
              className="w-full group"
            >
              <div className="flex items-center gap-0 bg-surface-container-lowest rounded-2xl overflow-hidden hover:shadow-ambient-sm transition-shadow">
                {/* Priority bar */}
                <div className={`w-1 self-stretch ${PRIORITY_BAR[task.priority] ?? 'bg-outline'}`} />

                <div className="flex-1 flex items-center gap-4 px-5 py-4">
                  {/* Status icon */}
                  <span
                    className={`material-symbols-outlined text-xl shrink-0 ${
                      task.status === 'done' ? 'text-primary' : 'text-outline/40'
                    }`}
                    style={task.status === 'done' ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {task.status === 'done' ? 'check_circle' : 'radio_button_unchecked'}
                  </span>

                  {/* Title */}
                  <div className="flex-1 text-left min-w-0">
                    <p className={`text-sm font-semibold text-on-surface truncate group-hover:text-primary transition-colors ${task.status === 'done' ? 'line-through text-outline' : ''}`}>
                      {task.title}
                    </p>
                    {task.project && (
                      <p className="text-[11px] text-outline mt-0.5">{task.project.name}</p>
                    )}
                  </div>

                  {/* Metadata badges */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_BADGE[task.status] ?? 'bg-surface-container text-outline'}`}>
                      {STATUS_LABEL[task.status] ?? task.status}
                    </span>

                    {task.billable && (
                      <span className="w-6 h-6 rounded-full bg-tertiary-container flex items-center justify-center" title="Billable">
                        <span className="material-symbols-outlined text-xs text-tertiary">attach_money</span>
                      </span>
                    )}

                    {task.due_date && (
                      <span className={`flex items-center gap-1 text-[11px] font-semibold ${isOverdue(task) ? 'text-error' : 'text-outline'}`}>
                        <span className="material-symbols-outlined text-sm">event</span>
                        {formatDate(task.due_date)}
                      </span>
                    )}

                    {task.assignee && (
                      <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-on-primary-container">
                          {task.assignee.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    <span className="material-symbols-outlined text-lg text-outline/40 group-hover:text-outline transition-colors">chevron_right</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <QuickTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={fetchTasks}
        projects={projects}
        currentUserId={userId}
        userRole={userRole}
      />
    </div>
  )
}
