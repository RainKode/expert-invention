'use client'

import { useState, useEffect, useCallback } from 'react'

interface ReviewerSendBackModalProps {
  open: boolean
  onClose: () => void
  onSentBack?: () => void
  taskId: string
  taskTitle: string
  assigneeName?: string
}

const MAX_CHARS = 500

export default function ReviewerSendBackModal({
  open,
  onClose,
  onSentBack,
  taskId,
  taskTitle,
  assigneeName,
}: ReviewerSendBackModalProps) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setReason(''); setError('') }
  }, [open])

  const handleSubmit = useCallback(async () => {
    if (!reason.trim()) { setError('Reason is required'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/tasks/${taskId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_back', comment: reason.trim() }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to send back')
        return
      }
      onSentBack?.()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }, [reason, taskId, onSentBack, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-[20px]" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface-container rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-xl text-excitement">undo</span>
            <h2 className="text-base font-bold text-on-surface">Send back for revision</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Task context strip */}
          <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
            <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-outline">
                {assigneeName ? assigneeName.charAt(0).toUpperCase() : '?'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface line-clamp-1">{taskTitle}</p>
              {assigneeName && <p className="text-xs text-outline">Submitted by {assigneeName}</p>}
            </div>
          </div>

          {/* Reason field */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">
              Reason <span className="text-error">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Explain what needs to be revised…"
              rows={4}
              className="w-full px-4 py-3 bg-surface-container-low rounded-2xl text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-2 focus:ring-error/30 resize-none"
            />
            <p className="text-[11px] text-outline text-right mt-1">{reason.length}/{MAX_CHARS}</p>
          </div>

          {/* Info alert */}
          <div className="flex items-start gap-2 p-3 bg-secondary-container/40 rounded-xl">
            <span className="material-symbols-outlined text-sm text-secondary shrink-0 mt-0.5">info</span>
            <p className="text-xs text-on-secondary-container">
              The assignee will be notified and the task will move back to In Progress.
            </p>
          </div>

          {error && <p className="text-sm text-error bg-error-container rounded-xl px-4 py-2">{error}</p>}
        </div>

        <div className="px-6 py-4 flex gap-3 bg-surface-container-low/50">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reason.trim()}
            className="flex-1 py-2.5 rounded-full text-sm font-bold text-white bg-error shadow-[0px_2px_8px_rgba(77,85,106,0.06)] disabled:opacity-60 transition-opacity"
          >
            {submitting ? 'Sending…' : 'Send Back'}
          </button>
        </div>
      </div>
    </div>
  )
}
