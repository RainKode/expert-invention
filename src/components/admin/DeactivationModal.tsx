'use client'

import { useState, useEffect, useCallback } from 'react'

interface OpenTask {
  id: string
  title: string
  status: string
  due_date: string | null
  priority: string
}

interface TeamMember {
  id: string
  name: string
}

interface Props {
  open: boolean
  userId: string
  onClose: () => void
  onDeactivated: () => void
}

interface ResolvedTask {
  taskId: string
  action: 'reassign' | 'close'
  reassignTo?: string
  assigneeName?: string
}

export default function DeactivationModal({ open, userId, onClose, onDeactivated }: Props) {
  const [tasks, setTasks] = useState<OpenTask[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [targetName, setTargetName] = useState('')
  const [loading, setLoading] = useState(true)
  const [resolvedTasks, setResolvedTasks] = useState<ResolvedTask[]>([])
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [reassignSelections, setReassignSelections] = useState<Record<string, string>>({})
  const [deactivating, setDeactivating] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const res = await fetch(`/api/admin/users/${userId}/open-tasks`)
    const data = await res.json()
    setTasks(data.tasks ?? [])
    setTeamMembers(data.team_members ?? [])
    setTargetName(data.target_name ?? '')
    setResolvedTasks([])
    setExpandedTask(null)
    setReassignSelections({})
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (open) fetchTasks()
  }, [open, fetchTasks])

  const totalTasks = tasks.length
  const resolvedCount = resolvedTasks.length
  const remaining = totalTasks - resolvedCount
  const allResolved = remaining === 0 && totalTasks > 0

  async function handleReassign(taskId: string) {
    const assigneeId = reassignSelections[taskId]
    if (!assigneeId) return
    setActionLoading(taskId)
    await fetch(`/api/admin/users/${userId}/open-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, action: 'reassign', reassign_to: assigneeId }),
    })
    const member = teamMembers.find((m) => m.id === assigneeId)
    setResolvedTasks((prev) => [...prev, { taskId, action: 'reassign', reassignTo: assigneeId, assigneeName: member?.name }])
    setExpandedTask(null)
    setActionLoading(null)
  }

  async function handleClose(taskId: string) {
    setActionLoading(taskId)
    await fetch(`/api/admin/users/${userId}/open-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, action: 'close' }),
    })
    setResolvedTasks((prev) => [...prev, { taskId, action: 'close' }])
    setExpandedTask(null)
    setActionLoading(null)
  }

  async function handleDeactivate() {
    setDeactivating(true)
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    setDeactivating(false)
    onDeactivated()
  }

  function isResolved(taskId: string) {
    return resolvedTasks.some((r) => r.taskId === taskId)
  }

  function getResolution(taskId: string) {
    return resolvedTasks.find((r) => r.taskId === taskId)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#f7f9fb]/80 backdrop-blur-[20px]">
      <section className="w-full max-w-[720px] bg-white rounded-2xl shadow-[0px_24px_48px_rgba(77,85,106,0.06)] flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <header className="pt-10 px-10 pb-6">
          <div className="flex justify-between items-end mb-2 flex-wrap gap-3">
            <h1 className="text-xl font-bold tracking-tight text-on-surface">
              Before deactivating {targetName}
            </h1>
            {totalTasks > 0 && (
              <div className="bg-[#e6e8ea] px-4 py-1.5 rounded-full flex items-center gap-2">
                <span className="text-xs font-semibold text-[#363e52]">{resolvedCount} of {totalTasks} resolved</span>
                <div className="w-24 h-1.5 bg-[#e0e3e5] rounded-full overflow-hidden">
                  <div
                    className="bg-[#363e52] h-full transition-all"
                    style={{ width: `${totalTasks > 0 ? (resolvedCount / totalTasks) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <p className="text-on-surface-variant text-sm max-w-md">
            To ensure business continuity, please reassign or close all active responsibilities belonging to this team member.
          </p>
        </header>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto px-10 space-y-4 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-integrity border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-on-surface-variant font-medium">No open tasks found</p>
              <p className="text-on-surface-variant/60 text-sm mt-1">You can proceed with deactivation.</p>
            </div>
          ) : (
            tasks.map((task) => {
              const resolved = isResolved(task.id)
              const resolution = getResolution(task.id)
              const isExpanded = expandedTask === task.id

              return resolved ? (
                /* Resolved row */
                <div key={task.id} className="flex items-center justify-between p-5 bg-[#f2f4f6]/40 rounded-2xl opacity-60">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-on-surface text-sm">{task.title}</h4>
                      <p className="text-xs text-on-surface-variant">
                        Status: Resolved • {resolution?.action === 'reassign'
                          ? `Reassigned to ${resolution.assigneeName ?? 'team member'}`
                          : 'Task Closed'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Active row */
                <div key={task.id} className="flex flex-col gap-4 p-5 bg-white border border-[#c6c6cd]/15 rounded-2xl shadow-[0px_4px_12px_rgba(77,85,106,0.03)]">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#dae2fd] flex items-center justify-center text-[#5c647b] flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-on-surface text-sm">{task.title}</h4>
                        <p className="text-xs text-on-surface-variant">
                          {task.due_date ? `Due ${new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No due date'}
                          {' • '}
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} priority
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isExpanded && (
                        <>
                          <button
                            onClick={() => setExpandedTask(task.id)}
                            disabled={actionLoading === task.id}
                            className="px-5 py-2.5 bg-[#e6e8ea] text-xs font-bold text-on-surface rounded-full transition-all hover:bg-[#d8dadc] active:scale-95"
                          >
                            Reassign
                          </button>
                          <button
                            onClick={() => handleClose(task.id)}
                            disabled={actionLoading === task.id}
                            className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-[#e6e8ea] rounded-full transition-all"
                          >
                            {actionLoading === task.id ? 'Closing…' : 'Close Task'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded reassign UI */}
                  {isExpanded && (
                    <div className="flex items-center gap-3 mt-1">
                      <select
                        value={reassignSelections[task.id] ?? ''}
                        onChange={(e) => setReassignSelections((prev) => ({ ...prev, [task.id]: e.target.value }))}
                        className="flex-1 bg-[#f2f4f6] border-0 rounded-full py-2.5 pl-5 pr-10 text-sm font-medium focus:ring-2 focus:ring-integrity/20 appearance-none"
                      >
                        <option value="" disabled>Reassign to…</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleReassign(task.id)}
                        disabled={!reassignSelections[task.id] || actionLoading === task.id}
                        className="h-10 px-6 bg-integrity text-white rounded-full text-xs font-bold transition-transform active:scale-95 shadow-sm disabled:opacity-40"
                      >
                        {actionLoading === task.id ? 'Saving…' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setExpandedTask(null)}
                        className="text-xs text-on-surface-variant hover:text-on-surface px-2"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <footer className="p-10 flex items-center justify-between bg-white/80 backdrop-blur-md">
          <button
            onClick={onClose}
            className="text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Cancel deactivation
          </button>
          <div className="flex items-center gap-4">
            {totalTasks > 0 && (
              <div className="flex items-center gap-2 text-on-surface-variant">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium">{remaining} tasks remaining</span>
              </div>
            )}
            <button
              onClick={handleDeactivate}
              disabled={!allResolved && totalTasks > 0}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${
                allResolved || totalTasks === 0
                  ? 'bg-integrity text-white shadow-lg hover:shadow-xl active:scale-95'
                  : 'bg-[#e0e3e5] text-on-surface-variant cursor-not-allowed opacity-50'
              }`}
            >
              {deactivating ? 'Deactivating…' : `Deactivate ${targetName.split(' ')[0]}`}
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}
