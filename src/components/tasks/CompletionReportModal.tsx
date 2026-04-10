'use client'

import { useState, useEffect, useCallback } from 'react'

interface CompletionReportModalProps {
  open: boolean
  onClose: () => void
  onSubmitted?: () => void
  taskId: string
  taskTitle: string
}

export default function CompletionReportModal({
  open,
  onClose,
  onSubmitted,
  taskId,
  taskTitle,
}: CompletionReportModalProps) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setText(''); setError('') }
  }, [open])

  const handleSubmit = useCallback(async () => {
    if (!text.trim()) { setError('Please describe what was accomplished'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/tasks/${taskId}/completion-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to submit report')
        return
      }
      onSubmitted?.()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }, [text, taskId, onSubmitted, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface-container rounded-3xl shadow-2xl overflow-hidden">
        {/* Header with checkmark icon */}
        <div className="px-6 pt-8 pb-5 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-tertiary-container flex items-center justify-center mb-4">
            <span
              className="material-symbols-outlined text-3xl text-tertiary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              task_alt
            </span>
          </div>
          <h2 className="text-lg font-bold text-on-surface">Completion Report</h2>
          <p className="text-sm text-outline mt-1 line-clamp-2">{taskTitle}</p>
        </div>

        <div className="px-6 pb-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2">
              What did you accomplish?
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Describe the work completed, outcomes, and any notes…"
              rows={5}
              className="w-full px-4 py-3 bg-surface-container-low rounded-2xl text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* File upload placeholder */}
          <div className="border-2 border-dashed border-surface-container-high rounded-2xl p-4 text-center">
            <span className="material-symbols-outlined text-2xl text-outline mx-auto block mb-1">attach_file</span>
            <p className="text-xs text-outline">Attach a file (optional)</p>
            <p className="text-[10px] text-outline/60">PDF, DOCX, PNG up to 10MB</p>
          </div>

          {error && <p className="text-sm text-error bg-error-container rounded-xl px-4 py-2">{error}</p>}
        </div>

        <div className="px-6 py-4 flex gap-3 border-t border-surface-container-high">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-ambient-sm disabled:opacity-60 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
          >
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  )
}
