'use client'

import { useState, useEffect, useCallback } from 'react'

interface TaskOption { id: string; title: string; status: string }

interface AddDependencyModalProps {
  open: boolean
  onClose: () => void
  onAdded?: () => void
  taskId: string
  taskTitle: string
  availableTasks: TaskOption[]
}

export default function AddDependencyModal({
  open,
  onClose,
  onAdded,
  taskId,
  taskTitle,
  availableTasks,
}: AddDependencyModalProps) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setSearch(''); setSelectedId(''); setError('') }
  }, [open])

  const filtered = availableTasks.filter(t =>
    t.id !== taskId &&
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = useCallback(async () => {
    if (!selectedId) { setError('Please select a task'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/tasks/${taskId}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depends_on_task_id: selectedId }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to add dependency')
        return
      }
      onAdded?.()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }, [selectedId, taskId, onAdded, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-container rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between border-b border-surface-container-high">
          <h2 className="text-base font-bold text-on-surface">Add Dependency</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Current task */}
          <div className="p-3 bg-surface-container-low rounded-xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">Blocked task</p>
            <p className="text-sm font-semibold text-on-surface">{taskTitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-surface-container-high" />
            <span className="text-xs text-outline">depends on</span>
            <div className="h-px flex-1 bg-surface-container-high" />
          </div>

          {/* Search tasks */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline">search</span>
            <input
              type="text"
              placeholder="Search tasks…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Task list */}
          <div className="max-h-52 overflow-y-auto space-y-1">
            {filtered.length === 0
              ? <p className="text-sm text-outline text-center py-4">No tasks found</p>
              : filtered.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                      selectedId === t.id
                        ? 'bg-primary-container text-on-primary-container'
                        : 'hover:bg-surface-container-high text-on-surface'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        t.status === 'done' ? 'bg-green-500' : t.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-400'
                      }`}
                    />
                    <span className="text-sm flex-1">{t.title}</span>
                    {selectedId === t.id && (
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    )}
                  </button>
                ))}
          </div>

          {error && <p className="text-sm text-error bg-error-container rounded-xl px-4 py-2">{error}</p>}
        </div>

        <div className="px-6 py-4 flex gap-3 border-t border-surface-container-high">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedId}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-ambient-sm disabled:opacity-60 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
          >
            {submitting ? 'Adding…' : 'Add Dependency'}
          </button>
        </div>
      </div>
    </div>
  )
}
