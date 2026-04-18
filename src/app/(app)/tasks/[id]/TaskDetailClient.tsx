'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import FileAttachments from '@/components/files/FileAttachments'
import { CustomFieldValue } from '@/types'

const ReassignModal = dynamic(() => import('@/components/tasks/ReassignModal'), { ssr: false })
const CompletionReportModal = dynamic(() => import('@/components/tasks/CompletionReportModal'), { ssr: false })
const ReviewerSendBackModal = dynamic(() => import('@/components/tasks/ReviewerSendBackModal'), { ssr: false })
const AddDependencyModal = dynamic(() => import('@/components/tasks/AddDependencyModal'), { ssr: false })
const QuickTaskModal = dynamic(() => import('@/components/tasks/QuickTaskModal'), { ssr: false })

const STATUS_BADGE: Record<string, string> = {
  todo: 'bg-surface-container text-on-surface-variant',
  in_progress: 'bg-energetic-10 text-energetic',
  in_review: 'bg-integrity-10 text-integrity',
  done: 'bg-kindness-10 text-kindness',
}

const STATUS_LABEL: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

const PRIORITY_LABEL: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const PRIORITY_COLOR: Record<string, string> = {
  high: 'bg-excitement-10 text-excitement',
  medium: 'bg-energetic-10 text-energetic',
  low: 'bg-surface-container text-on-surface-variant',
}

const TIMELINE_LABELS: Record<string, string> = {
  created: 'Task created',
  assigned: 'Assigned',
  status_changed: 'Status changed',
  reassigned: 'Reassigned',
  comment_added: 'Comment added',
  file_added: 'File added',
  dependency_added: 'Dependency added',
  dependency_resolved: 'Dependency resolved',
  completion_report_submitted: 'Completion report submitted',
  marked_done: 'Marked as done',
  sent_back: 'Sent back for revision',
  subtask_added: 'Subtask added',
  subtask_status_changed: 'Subtask status changed',
  field_updated: 'Field updated',
}

interface Profile { id: string; name: string; email: string }
interface Project { id: string; name: string }
interface Subtask { id: string; title: string; status: string; priority: string; assignee: Profile | null }
interface Dependency { task_id: string; depends_on_task_id: string; depends_on: { id: string; title: string; status: string } | null }
interface TimelineEvent { id: string; event_type: string; actor: Profile | null; old_value: string | null; new_value: string | null; metadata: Record<string, unknown> | null; created_at: string }

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  task_type: string
  task_nature: string
  billable: boolean
  due_date: string | null
  estimated_hours: number | null
  actual_hours: number | null
  review_hours: number | null
  completion_report_text: string | null
  creator: Profile | null
  assignee: Profile | null
  reviewer: Profile | null
  project: Project | null
  subtasks: Subtask[]
  task_dependencies: Dependency[]
  created_at: string
  completed_at: string | null
}

interface TaskDetailClientProps {
  taskId: string
  userId: string
  userRole: string
  teamMembers: { id: string; name: string; email: string }[]
  availableTasksForDeps: { id: string; title: string; status: string }[]
}

const VALID_NEXT: Record<string, string[]> = {
  todo: ['in_progress'],
  in_progress: ['in_review'],
  in_review: [],
  done: [],
}

export default function TaskDetailClient({
  taskId,
  userId,
  userRole,
  teamMembers,
  availableTasksForDeps,
}: TaskDetailClientProps) {
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('details')
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [reassignOpen, setReassignOpen] = useState(false)
  const [completionOpen, setCompletionOpen] = useState(false)
  const [sendBackOpen, setSendBackOpen] = useState(false)
  const [depModalOpen, setDepModalOpen] = useState(false)
  const [subtaskModalOpen, setSubtaskModalOpen] = useState(false)
  const [statusChanging, setStatusChanging] = useState(false)
  const [customFieldValues, setCustomFieldValues] = useState<CustomFieldValue[]>([])
  const [savingField, setSavingField] = useState<string | null>(null)
  const [errorToast, setErrorToast] = useState<string | null>(null)

  const isManager = ['manager', 'senior_manager', 'admin', 'assistant_manager'].includes(userRole)
  const isReviewer = task?.reviewer?.id === userId
  const isAssignee = task?.assignee?.id === userId
  const isCreator = task?.creator?.id === userId

  const fetchTask = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/tasks/${taskId}`)
    if (res.ok) {
      const data = await res.json()
      setTask(data.task)
    }
    setLoading(false)
  }, [taskId])

  const fetchTimeline = useCallback(async () => {
    setTimelineLoading(true)
    const res = await fetch(`/api/tasks/${taskId}/timeline`)
    if (res.ok) {
      const data = await res.json()
      setTimeline(data.events ?? [])
    }
    setTimelineLoading(false)
  }, [taskId])

  useEffect(() => { fetchTask() }, [fetchTask])
  useEffect(() => { if (activeTab === 'timeline') fetchTimeline() }, [activeTab, fetchTimeline])
  useEffect(() => {
    fetch(`/api/tasks/${taskId}/custom-field-values`)
      .then(r => r.json())
      .then(d => setCustomFieldValues(d.values ?? []))
      .catch(() => {})
  }, [taskId])

  const handleStatusChange = useCallback(async (newStatus: string) => {
    setStatusChanging(true)
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) { await fetchTask() }
    else {
      const d = await res.json()
      setErrorToast(d.error ?? 'Failed to update status')
    }
    setStatusChanging(false)
  }, [taskId, fetchTask])

  const [approving, setApproving] = useState(false)

  const handleApprove = useCallback(async () => {
    setApproving(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (res.ok) await fetchTask()
      else {
        const d = await res.json()
        setErrorToast(d.error ?? 'Failed to approve')
      }
    } finally {
      setApproving(false)
    }
  }, [taskId, fetchTask])

  const handleRemoveDep = useCallback(async (depId: string) => {
    await fetch(`/api/tasks/${taskId}/dependencies?depends_on_task_id=${depId}`, { method: 'DELETE' })
    await fetchTask()
  }, [taskId, fetchTask])

  const handleCustomFieldSave = useCallback(async (fieldId: string, value: string) => {
    setSavingField(fieldId)
    const res = await fetch(`/api/tasks/${taskId}/custom-field-values`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field_definition_id: fieldId, value }),
    })
    if (res.ok) {
      const d = await res.json()
      setCustomFieldValues(prev => {
        const exists = prev.find(v => v.field_definition_id === fieldId)
        if (exists) return prev.map(v => v.field_definition_id === fieldId ? d.value : v)
        return [...prev, d.value]
      })
    }
    setSavingField(null)
  }, [taskId])

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
  const formatDateTime = (d: string) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  if (loading) {
    return (
      <div className="py-24 text-center text-outline">
        <span className="material-symbols-outlined text-3xl animate-spin block mb-2">progress_activity</span>
        Loading task…
      </div>
    )
  }

  if (!task) {
    return (
      <div className="py-24 text-center">
        <p className="text-outline">Task not found</p>
        <Link href="/tasks" className="text-sm text-primary hover:underline mt-2 block">← Back to tasks</Link>
      </div>
    )
  }

  const canAdvanceStatus = (isAssignee || isCreator || isManager) && VALID_NEXT[task.status]?.length > 0
  const needsCompletionReport = !task.completion_report_text && task.status === 'in_progress'
  const nextStatuses = VALID_NEXT[task.status] ?? []

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back link */}
        <Link href="/tasks" className="inline-flex items-center gap-1 text-sm text-outline hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to tasks
        </Link>

        {/* Header */}
        <div className="bg-white rounded-3xl p-6 shadow-[0px_2px_8px_rgba(77,85,106,0.06)]">
          <div className="flex flex-wrap items-start gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${PRIORITY_COLOR[task.priority]}`}>
              {PRIORITY_LABEL[task.priority]} Priority
            </span>
            {task.project && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary-container text-on-secondary-container">
                {task.project.name}
              </span>
            )}
            {task.billable && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-kindness-10 text-kindness">Billable</span>
            )}
          </div>

          <h1 className="text-xl font-bold text-on-surface mb-5">{task.title}</h1>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status badge */}
            <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${STATUS_BADGE[task.status]}`}>
              {STATUS_LABEL[task.status]}
            </span>

            {/* Progress buttons */}
            {canAdvanceStatus && nextStatuses.map(next => (
              <button
                key={next}
                onClick={() => {
                  if (next === 'in_review' && needsCompletionReport) {
                    setCompletionOpen(true)
                  } else {
                    handleStatusChange(next)
                  }
                }}
                disabled={statusChanging}
                className="px-5 py-2 rounded-full text-sm font-bold text-white shadow-[0px_2px_8px_rgba(77,85,106,0.06)] disabled:opacity-60 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #2226F7 0%, #00D6A3 100%)' }}
              >
                {statusChanging ? '…' : next === 'in_review' ? 'Submit for Review' : 'Mark In Progress'}
              </button>
            ))}

            {/* Reviewer actions */}
            {task.status === 'in_review' && (isReviewer || isManager) && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="px-5 py-2 rounded-full text-sm font-bold text-on-primary shadow-[0px_2px_8px_rgba(77,85,106,0.06)] transition-colors disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #2226F7 0%, #00D6A3 100%)' }}
                >
                  {approving ? 'Approving…' : 'Approve'}
                </button>
                <button
                  onClick={() => setSendBackOpen(true)}
                  className="px-5 py-2 rounded-full text-sm font-bold text-excitement hover:bg-excitement-10 transition-colors"
                >
                  Send Back
                </button>
              </>
            )}

            {/* Reassign */}
            {(isCreator || isManager) && task.status !== 'done' && (
              <button
                onClick={() => setReassignOpen(true)}
                className="px-4 py-2 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-base mr-1">swap_horiz</span>
                Reassign
              </button>
            )}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Left: tabs + content */}
          <div className="space-y-5">
            {/* Tabs */}
            <div className="flex gap-1">
              {(['details', 'timeline'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-semibold transition-colors relative capitalize ${
                    activeTab === tab ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                      style={{ background: 'linear-gradient(135deg, #2226F7 0%, #00D6A3 100%)' }}
                    />
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Description */}
                {task.description && (
                  <div className="bg-white rounded-2xl p-5 shadow-[0px_2px_8px_rgba(77,85,106,0.06)]">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-outline mb-3">Description</h3>
                    <p className="text-sm text-on-surface whitespace-pre-wrap">{task.description}</p>
                  </div>
                )}

                {/* Completion report */}
                {task.completion_report_text && (
                  <div className="bg-kindness-10 rounded-2xl p-5">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-kindness mb-3">Completion Report</h3>
                    <p className="text-sm text-on-surface whitespace-pre-wrap">{task.completion_report_text}</p>
                  </div>
                )}

                {/* Completion report CTA */}
                {!task.completion_report_text && task.status === 'in_progress' && isAssignee && (
                  <button
                    onClick={() => setCompletionOpen(true)}
                    className="w-full p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container-high transition-colors text-sm text-outline hover:text-primary"
                  >
                    + Add completion report
                  </button>
                )}

                {/* Subtasks */}
                <div className="bg-white rounded-2xl p-5 border border-surface-container-high/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-outline">
                      Subtasks ({task.subtasks?.length ?? 0})
                    </h3>
                    {task.status !== 'done' && (
                      <button
                        onClick={() => setSubtaskModalOpen(true)}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        + Add subtask
                      </button>
                    )}
                  </div>

                  {(task.subtasks ?? []).length === 0 ? (
                    <p className="text-sm text-outline/60">No subtasks yet</p>
                  ) : (
                    <div className="space-y-2">
                      {task.subtasks.map(sub => (
                        <Link
                          key={sub.id}
                          href={`/tasks/${sub.id}`}
                          className={`flex items-center gap-3 p-4 rounded-2xl transition-colors hover:bg-surface-container-high ${
                            sub.status === 'done'
                              ? 'bg-surface-container'
                              : 'bg-surface-container-low'
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-xl ${sub.status === 'done' ? 'text-primary' : 'text-outline/40'}`}
                            style={sub.status === 'done' ? { fontVariationSettings: "'FILL' 1" } : undefined}
                          >
                            {sub.status === 'done' ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <span className={`text-sm flex-1 ${sub.status === 'done' ? 'line-through text-outline' : 'text-on-surface font-medium'}`}>
                            {sub.title}
                          </span>
                          {sub.assignee && (
                            <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center">
                              <span className="text-[10px] font-bold text-on-primary-container">{sub.assignee.name.charAt(0)}</span>
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dependencies */}
                <div className="bg-white rounded-2xl p-5 shadow-[0px_2px_8px_rgba(77,85,106,0.06)]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-outline">Dependencies</h3>
                    {task.status !== 'done' && (
                      <button
                        onClick={() => setDepModalOpen(true)}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        + Add
                      </button>
                    )}
                  </div>

                  {(task.task_dependencies ?? []).length === 0 ? (
                    <p className="text-sm text-outline/60">No dependencies</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {task.task_dependencies.map(dep => dep.depends_on && (
                        <div key={dep.depends_on_task_id} className="flex items-center gap-3 p-3 bg-excitement-10 rounded-xl">
                          <span className="material-symbols-outlined text-sm text-excitement">block</span>
                          <Link href={`/tasks/${dep.depends_on.id}`} className="text-sm flex-1 font-medium text-on-surface hover:text-primary truncate">
                            {dep.depends_on.title}
                          </Link>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[dep.depends_on.status] ?? 'bg-surface-container text-outline'}`}>
                            {STATUS_LABEL[dep.depends_on.status] ?? dep.depends_on.status}
                          </span>
                          {(isCreator || isManager) && (
                            <button
                              onClick={() => handleRemoveDep(dep.depends_on_task_id)}
                              className="p-1 text-outline hover:text-excitement transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Attachments */}
                <div className="bg-white rounded-2xl p-5 shadow-[0px_2px_8px_rgba(77,85,106,0.06)]">
                  <FileAttachments
                    taskId={task.id}
                    context="attachment"
                    readOnly={task.status === 'done'}
                  />
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-3">
                {timelineLoading ? (
                  <div className="py-8 text-center text-outline">
                    <span className="material-symbols-outlined animate-spin block mb-1">progress_activity</span>
                    Loading timeline…
                  </div>
                ) : timeline.length === 0 ? (
                  <p className="text-sm text-outline text-center py-8">No timeline events yet</p>
                ) : (
                  <div className="relative pl-6">
                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-surface-container-high" />
                    {timeline.map((event, i) => (
                      <div key={event.id} className={`relative flex gap-4 ${i < timeline.length - 1 ? 'pb-5' : ''}`}>
                        <div className="absolute left-[-16px] w-4 h-4 rounded-full bg-surface-container flex items-center justify-center" />
                          <div className="flex-1 bg-white rounded-2xl p-4 shadow-[0px_2px_8px_rgba(77,85,106,0.06)]">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold text-on-surface">{TIMELINE_LABELS[event.event_type] ?? event.event_type}</p>
                            <p className="text-[10px] text-outline">{formatDateTime(event.created_at)}</p>
                          </div>
                          {event.actor && (
                            <p className="text-[11px] text-outline">{event.actor.name}</p>
                          )}
                          {event.old_value && event.new_value && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-outline line-through">{event.old_value}</span>
                              <span className="material-symbols-outlined text-sm text-outline">arrow_forward</span>
                              <span className="text-xs font-semibold text-on-surface">{event.new_value}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: metadata sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-[0px_2px_8px_rgba(77,85,106,0.06)] space-y-5">
              <MetaRow label="Assignee" value={task.assignee?.name ?? 'Unassigned'} />
              <MetaRow label="Creator" value={task.creator?.name ?? '—'} />
              {task.reviewer && <MetaRow label="Reviewer" value={task.reviewer.name} />}
              <MetaRow label="Status" value={STATUS_LABEL[task.status]} />
              <MetaRow label="Priority" value={PRIORITY_LABEL[task.priority]} />
              <MetaRow label="Type" value={task.task_type === 'adhoc' ? 'Ad Hoc' : 'Planned'} />
              <MetaRow label="Nature" value={task.task_nature === 'core' ? 'Core' : 'Supporting'} />
              <MetaRow label="Billable" value={task.billable ? 'Yes' : 'No'} />
              {task.project && <MetaRow label="Project" value={task.project.name} />}
              <MetaRow label="Due Date" value={formatDate(task.due_date)} />
              {task.estimated_hours != null && <MetaRow label="Est. Hours" value={`${task.estimated_hours}h`} />}
              {task.actual_hours != null && <MetaRow label="Actual Hours" value={`${task.actual_hours}h`} />}
              {task.review_hours != null && <MetaRow label="Review Hours" value={`${task.review_hours}h`} />}
              <MetaRow label="Created" value={formatDate(task.created_at)} />
              {task.completed_at && <MetaRow label="Completed" value={formatDate(task.completed_at)} />}
            </div>

            {/* Custom Field Values */}
            {customFieldValues.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-[0px_2px_8px_rgba(77,85,106,0.06)] space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Custom Fields</p>
                {customFieldValues.map(cfv => {
                  const def = cfv.field_definition
                  if (!def) return null
                  return (
                    <CustomFieldEditor
                      key={cfv.field_definition_id}
                      fieldValue={cfv}
                      saving={savingField === cfv.field_definition_id}
                      onSave={val => handleCustomFieldSave(cfv.field_definition_id, val)}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ReassignModal
        open={reassignOpen}
        onClose={() => setReassignOpen(false)}
        onReassigned={fetchTask}
        taskId={task.id}
        taskTitle={task.title}
        currentAssigneeName={task.assignee?.name}
        teamMembers={teamMembers}
      />

      <CompletionReportModal
        open={completionOpen}
        onClose={() => setCompletionOpen(false)}
        onSubmitted={fetchTask}
        taskId={task.id}
        taskTitle={task.title}
      />

      <ReviewerSendBackModal
        open={sendBackOpen}
        onClose={() => setSendBackOpen(false)}
        onSentBack={fetchTask}
        taskId={task.id}
        taskTitle={task.title}
        assigneeName={task.assignee?.name}
      />

      <AddDependencyModal
        open={depModalOpen}
        onClose={() => setDepModalOpen(false)}
        onAdded={fetchTask}
        taskId={task.id}
        taskTitle={task.title}
        availableTasks={availableTasksForDeps}
      />

      <QuickTaskModal
        open={subtaskModalOpen}
        onClose={() => setSubtaskModalOpen(false)}
        onCreated={fetchTask}
        currentUserId={userId}
        userRole={userRole}
      />

      {/* Error toast */}
      {errorToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-sm font-semibold shadow-lg bg-excitement-10 text-excitement">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {errorToast}
            <button onClick={() => setErrorToast(null)} className="ml-2 opacity-60 hover:opacity-100">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-0.5">{label}</p>
      <p className="text-sm text-on-surface font-medium">{value}</p>
    </div>
  )
}

function CustomFieldEditor({ fieldValue, saving, onSave }: {
  fieldValue: CustomFieldValue
  saving: boolean
  onSave: (val: string) => void
}) {
  const def = fieldValue.field_definition!
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(fieldValue.value ?? '')

  if (!editing) {
    return (
      <div className="group flex items-start justify-between gap-2 cursor-pointer" onClick={() => setEditing(true)}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-0.5">{def.name}</p>
          <p className="text-sm text-on-surface font-medium">{fieldValue.value || <span className="text-outline italic">—</span>}</p>
        </div>
        <span className="material-symbols-outlined text-[14px] text-outline opacity-0 group-hover:opacity-100 mt-1 transition-opacity">edit</span>
      </div>
    )
  }

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1.5">{def.name}</p>
      {def.field_type === 'dropdown' ? (
        <select
          value={val}
          onChange={e => setVal(e.target.value)}
          className="w-full px-3 py-1.5 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
        >
          <option value="">— Select —</option>
          {(def.options ?? []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : def.field_type === 'checkbox' ? (
        <button
          type="button"
          onClick={() => setVal(v => v === 'true' ? 'false' : 'true')}
          className={`relative w-10 h-5 rounded-full transition-colors ${val === 'true' ? 'bg-primary' : 'bg-outline/30'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${val === 'true' ? 'translate-x-5' : ''}`} />
        </button>
      ) : (
        <input
          type={def.field_type === 'number' ? 'number' : def.field_type === 'date' ? 'date' : 'text'}
          value={val}
          onChange={e => setVal(e.target.value)}
          className="w-full px-3 py-1.5 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      )}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => { onSave(val); setEditing(false) }}
          disabled={saving}
          className="px-3 py-1 rounded-full text-xs font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #2226F7 0%, #00D6A3 100%)' }}
        >
          {saving ? '…' : 'Save'}
        </button>
        <button onClick={() => { setVal(fieldValue.value ?? ''); setEditing(false) }} className="px-3 py-1 rounded-full text-xs text-outline hover:text-on-surface">
          Cancel
        </button>
      </div>
    </div>
  )
}
