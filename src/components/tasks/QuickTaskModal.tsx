'use client'

import { useState, useEffect } from 'react'
import { CustomFieldDefinition } from '@/types'

interface Project { id: string; name: string }
interface TeamMember { id: string; name: string; email: string }

interface QuickTaskModalProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void
  defaultAssigneeId?: string
  projects?: Project[]
  teamMembers?: TeamMember[]
  currentUserId: string
  userRole: string
}

const PRIORITY_OPTIONS = ['low', 'medium', 'high'] as const
const HOURS_STEP = 0.25

export default function QuickTaskModal({
  open,
  onClose,
  onCreated,
  projects = [],
  teamMembers = [],
  currentUserId,
  userRole,
}: QuickTaskModalProps) {
  const isManager = ['manager', 'senior_manager', 'admin', 'assistant_manager'].includes(userRole)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showDescription, setShowDescription] = useState(false)
  const [assigneeId, setAssigneeId] = useState(currentUserId)
  const [reviewerId, setReviewerId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [estimatedHours, setEstimatedHours] = useState(1)
  const [taskType, setTaskType] = useState<'planned' | 'adhoc'>('planned')
  const [taskNature, setTaskNature] = useState<'core' | 'supporting'>('core')
  const [projectId, setProjectId] = useState('')
  const [billable, setBillable] = useState(false)
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)
  const [actualHours, setActualHours] = useState(1)
  const [completionReport, setCompletionReport] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([])
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({})

  // Fetch applicable custom fields when project changes
  useEffect(() => {
    if (!open) return
    const params = new URLSearchParams({ scope_type: 'global' })
    if (projectId) params.append('scope_id', projectId)
    fetch(`/api/custom-fields?${params}`).then(r => r.json()).then(d => {
      setCustomFields(d.fields ?? [])
    }).catch(() => {})
  }, [open, projectId])

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setTitle('')
      setDescription('')
      setShowDescription(false)
      setAssigneeId(currentUserId)
      setReviewerId('')
      setDueDate('')
      setPriority('medium')
      setEstimatedHours(1)
      setTaskType('planned')
      setTaskNature('core')
      setProjectId('')
      setBillable(false)
      setAlreadyCompleted(false)
      setActualHours(1)
      setCompletionReport('')
      setError('')
      setCustomFields([])
      setCustomFieldValues({})
    }
  }, [open, currentUserId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Task title is required'); return }
    if (alreadyCompleted && !completionReport.trim()) { setError('Completion report is required for completed tasks'); return }

    setSubmitting(true)
    setError('')

    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        assignee_id: assigneeId || currentUserId,
        reviewer_id: reviewerId || null,
        due_date: dueDate || null,
        priority,
        estimated_hours: estimatedHours,
        task_type: alreadyCompleted ? 'adhoc' : taskType,
        task_nature: taskNature,
        project_id: projectId || null,
        billable,
        already_completed: alreadyCompleted,
      }

      if (alreadyCompleted) {
        payload.actual_hours = actualHours
        payload.completion_report_text = completionReport
      }

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to create task')
        return
      }

      const created = await res.json()
      const taskId = created.task?.id
      if (taskId) {
        const valueEntries = Object.entries(customFieldValues).filter(([, v]) => v.trim())
        await Promise.all(valueEntries.map(([fieldId, value]) =>
          fetch(`/api/tasks/${taskId}/custom-field-values`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ field_definition_id: fieldId, value }),
          })
        ))
      }

      onCreated?.()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-[20px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-surface-container rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className="px-8 py-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span
              className="material-symbols-outlined bg-integrity text-white text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              add_task
            </span>
            <h2 className="text-xl font-bold bg-integrity text-white">New Task</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Task Title */}
          <div className="relative">
            <label className="absolute left-4 top-3 text-[10px] font-bold uppercase tracking-widest text-outline">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full pt-8 pb-3 px-4 bg-surface-container-low rounded-2xl text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* Description (collapsible) */}
          <div>
            <button
              type="button"
              onClick={() => setShowDescription(d => !d)}
              className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-sm">{showDescription ? 'expand_less' : 'expand_more'}</span>
              {showDescription ? 'Hide description' : 'Add description'}
            </button>
            {showDescription && (
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional task description…"
                rows={3}
                className="mt-2 w-full px-4 py-3 bg-surface-container-low rounded-2xl text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            )}
          </div>

          {/* Assignee + Reviewer + Due Date */}
          <div className="grid grid-cols-3 gap-4">
            <div className="relative">
              <label className="absolute left-4 top-3 text-[10px] font-bold uppercase tracking-widest text-outline z-10">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                disabled={!isManager}
                className="w-full pt-8 pb-3 px-4 bg-surface-container-low rounded-2xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 appearance-none"
              >
                {teamMembers.length > 0
                  ? teamMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))
                  : <option value={currentUserId}>Me</option>}
              </select>
            </div>
            <div className="relative">
              <label className="absolute left-4 top-3 text-[10px] font-bold uppercase tracking-widest text-outline z-10">
                Reviewer
              </label>
              <select
                value={reviewerId}
                onChange={e => setReviewerId(e.target.value)}
                className="w-full pt-8 pb-3 px-4 bg-surface-container-low rounded-2xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
              >
                <option value="">None</option>
                {teamMembers
                  .filter(m => m.id !== assigneeId)
                  .map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
              </select>
            </div>
            <div className="relative">
              <label className="absolute left-4 top-3 text-[10px] font-bold uppercase tracking-widest text-outline z-10">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full pt-8 pb-3 px-4 bg-surface-container-low rounded-2xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Priority segmented control */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Priority</label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                    priority === p
                      ? p === 'high'
                        ? 'bg-excitement text-white shadow-sm'
                        : p === 'medium'
                        ? 'bg-energetic-10 text-energetic shadow-sm'
                        : 'bg-secondary text-on-secondary shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Est. Hours stepper */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Estimated Hours</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEstimatedHours(h => Math.max(0, +(h - HOURS_STEP).toFixed(2)))}
                className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-lg">remove</span>
              </button>
              <span className="w-20 text-center text-lg font-bold text-on-surface">{estimatedHours}h</span>
              <button
                type="button"
                onClick={() => setEstimatedHours(h => +(h + HOURS_STEP).toFixed(2))}
                className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-lg">add</span>
              </button>
            </div>
          </div>

          {/* Type + Nature + Project selects */}
          <div className="grid grid-cols-3 gap-3">
            <div className="relative">
              <label className="absolute left-4 top-3 text-[10px] font-bold uppercase tracking-widest text-outline z-10">Type</label>
              <select
                value={taskType}
                onChange={e => setTaskType(e.target.value as 'planned' | 'adhoc')}
                disabled={alreadyCompleted}
                className="w-full pt-8 pb-3 px-4 bg-surface-container-low rounded-2xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 appearance-none"
              >
                <option value="planned">Planned</option>
                <option value="adhoc">Ad Hoc</option>
              </select>
            </div>
            <div className="relative">
              <label className="absolute left-4 top-3 text-[10px] font-bold uppercase tracking-widest text-outline z-10">Nature</label>
              <select
                value={taskNature}
                onChange={e => setTaskNature(e.target.value as 'core' | 'supporting')}
                className="w-full pt-8 pb-3 px-4 bg-surface-container-low rounded-2xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
              >
                <option value="core">Core</option>
                <option value="supporting">Supporting</option>
              </select>
            </div>
            <div className="relative">
              <label className="absolute left-4 top-3 text-[10px] font-bold uppercase tracking-widest text-outline z-10">Project</label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full pt-8 pb-3 px-4 bg-surface-container-low rounded-2xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
              >
                <option value="">None</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
              <div>
                <p className="text-sm font-semibold text-on-surface">Billable task</p>
                <p className="text-xs text-outline">This task will be billed to a client</p>
              </div>
              <button
                type="button"
                onClick={() => setBillable(b => !b)}
                className={`relative w-12 h-6 rounded-full transition-colors ${billable ? 'bg-primary' : 'bg-outline/30'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${billable ? 'translate-x-6' : 'translate-x-0'}`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
              <div>
                <p className="text-sm font-semibold text-on-surface">Mark as already completed</p>
                <p className="text-xs text-outline">Log a task that was done without going through the flow</p>
              </div>
              <button
                type="button"
                onClick={() => setAlreadyCompleted(b => !b)}
                className={`relative w-12 h-6 rounded-full transition-colors ${alreadyCompleted ? 'bg-primary' : 'bg-outline/30'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${alreadyCompleted ? 'translate-x-6' : 'translate-x-0'}`}
                />
              </button>
            </div>
          </div>

          {/* Conditional: Already completed fields */}
          {alreadyCompleted && (
            <div className="space-y-4 p-4 bg-kindness-10 rounded-2xl">
              <p className="text-[10px] font-bold uppercase tracking-widest text-kindness">Completion Details</p>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Actual Hours</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActualHours(h => Math.max(0, +(h - HOURS_STEP).toFixed(2)))}
                    className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">remove</span>
                  </button>
                  <span className="w-20 text-center text-lg font-bold text-on-surface">{actualHours}h</span>
                  <button
                    type="button"
                    onClick={() => setActualHours(h => +(h + HOURS_STEP).toFixed(2))}
                    className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Completion Report</label>
                <textarea
                  value={completionReport}
                  onChange={e => setCompletionReport(e.target.value)}
                  placeholder="Summarise what was done…"
                  rows={3}
                  className="w-full px-4 py-3 bg-surface-container-low rounded-2xl text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>
          )}

          {/* Custom Fields */}
          {customFields.length > 0 && (
            <div className="space-y-4 pt-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Custom Fields</p>
              {customFields.map(field => (
                <div key={field.id}>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">{field.name}</label>
                  {field.field_type === 'text' && (
                    <input
                      type="text"
                      value={customFieldValues[field.id] ?? ''}
                      onChange={e => setCustomFieldValues(p => ({ ...p, [field.id]: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-surface-container-low rounded-2xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  )}
                  {field.field_type === 'number' && (
                    <input
                      type="number"
                      value={customFieldValues[field.id] ?? ''}
                      onChange={e => setCustomFieldValues(p => ({ ...p, [field.id]: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-surface-container-low rounded-2xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  )}
                  {field.field_type === 'date' && (
                    <input
                      type="date"
                      value={customFieldValues[field.id] ?? ''}
                      onChange={e => setCustomFieldValues(p => ({ ...p, [field.id]: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-surface-container-low rounded-2xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  )}
                  {field.field_type === 'dropdown' && (
                    <select
                      value={customFieldValues[field.id] ?? ''}
                      onChange={e => setCustomFieldValues(p => ({ ...p, [field.id]: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-surface-container-low rounded-2xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                    >
                      <option value="">— Select —</option>
                      {(field.options ?? []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                  {field.field_type === 'checkbox' && (
                    <button
                      type="button"
                      onClick={() => setCustomFieldValues(p => ({ ...p, [field.id]: p[field.id] === 'true' ? 'false' : 'true' }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${customFieldValues[field.id] === 'true' ? 'bg-primary' : 'bg-outline/30'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${customFieldValues[field.id] === 'true' ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-excitement bg-excitement-10 rounded-xl px-4 py-2">{error}</p>
          )}
        </form>

        {/* Footer */}
        <div className="px-8 py-5 flex justify-end gap-3 bg-surface-container-low/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 rounded-full text-sm font-bold bg-integrity text-white shadow-[0px_2px_8px_rgba(77,85,106,0.06)] disabled:opacity-60 transition-opacity"
          >
            {submitting ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  )
}
