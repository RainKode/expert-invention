'use client'

import { useState, useEffect, useCallback } from 'react'

interface TeamMember { id: string; name: string; email: string }

interface ReassignModalProps {
  open: boolean
  onClose: () => void
  onReassigned?: () => void
  taskId: string
  taskTitle: string
  currentAssigneeName?: string
  teamMembers: TeamMember[]
}

export default function ReassignModal({
  open,
  onClose,
  onReassigned,
  taskId,
  taskTitle,
  currentAssigneeName,
  teamMembers,
}: ReassignModalProps) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setSearch(''); setSelectedId(''); setReason(''); setError('') }
  }, [open])

  const filtered = teamMembers.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = useCallback(async () => {
    if (!selectedId) { setError('Please select a member'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/tasks/${taskId}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_assignee_id: selectedId, reason: reason || undefined }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to reassign')
        return
      }
      onReassigned?.()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }, [selectedId, taskId, reason, onReassigned, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-[20px]" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface-container rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-on-surface">Reassign Task</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Current task context */}
          <div className="p-4 bg-surface-container-low rounded-2xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">Task</p>
            <p className="text-sm font-semibold text-on-surface">{taskTitle}</p>
            {currentAssigneeName && (
              <p className="text-xs text-outline mt-1">Currently assigned to {currentAssigneeName}</p>
            )}
          </div>

          {/* Search members */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline">search</span>
            <input
              type="text"
              placeholder="Search team members…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low rounded-full text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Member list */}
          <div className="max-h-44 overflow-y-auto space-y-1 -mr-2 pr-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-outline text-center py-4">No members found</p>
            ) : filtered.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                  selectedId === m.id
                    ? 'bg-integrity-10 text-integrity'
                    : 'hover:bg-surface-container-high text-on-surface'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-integrity-10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-integrity">{m.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="text-xs opacity-60">{m.email}</p>
                </div>
                {selectedId === m.id && (
                  <span className="material-symbols-outlined text-lg ml-auto" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                )}
              </button>
            ))}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Why is this task being reassigned?"
              rows={2}
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {error && <p className="text-sm text-error bg-error-container rounded-xl px-4 py-2">{error}</p>}
        </div>

        <div className="px-6 py-4 flex gap-3 bg-surface-container-low/50">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedId}
            className="flex-1 py-2.5 rounded-full text-sm font-bold text-white shadow-ambient-sm disabled:opacity-60 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
          >
            {submitting ? 'Reassigning…' : 'Reassign'}
          </button>
        </div>
      </div>
    </div>
  )
}
