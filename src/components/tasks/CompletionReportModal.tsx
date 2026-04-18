'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, FILE_TYPE_ICONS } from '@/types'

interface CompletionReportModalProps {
  open: boolean
  onClose: () => void
  onSubmitted?: () => void
  taskId: string
  taskTitle: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function CompletionReportModal({
  open,
  onClose,
  onSubmitted,
  taskId,
  taskTitle,
}: CompletionReportModalProps) {
  const [text, setText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) { setText(''); setError(''); setSelectedFile(null) }
  }, [open])

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('File type not supported')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File exceeds 25MB limit')
      return
    }
    setError('')
    setSelectedFile(file)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!text.trim()) { setError('Please describe what was accomplished'); return }
    setSubmitting(true)
    setError('')
    try {
      // 1. Submit the completion report text
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

      // 2. Upload file if selected
      if (selectedFile) {
        const form = new FormData()
        form.append('file', selectedFile)
        form.append('task_id', taskId)
        form.append('context', 'completion_report')

        const uploadRes = await fetch('/api/files', { method: 'POST', body: form })
        if (!uploadRes.ok) {
          // Report was submitted but file failed — still close
          console.error('File upload failed after report submission')
        }
      }

      onSubmitted?.()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }, [text, selectedFile, taskId, onSubmitted, onClose])

  if (!open) return null

  const fileIcon = selectedFile
    ? (FILE_TYPE_ICONS[selectedFile.type] ?? { icon: 'description', color: 'text-outline' })
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-[20px]" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface-container rounded-3xl shadow-2xl overflow-hidden">
        {/* Header with checkmark icon */}
        <div className="px-6 pt-8 pb-5 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-kindness-10 flex items-center justify-center mb-4">
            <span
              className="material-symbols-outlined text-3xl text-kindness"
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

          {/* File upload */}
          {selectedFile ? (
            <div className="bg-surface-container-low rounded-2xl p-4 flex items-center gap-3">
              <span className={`material-symbols-outlined ${fileIcon?.color ?? 'text-outline'}`}>
                {fileIcon?.icon ?? 'description'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">{selectedFile.name}</p>
                <p className="text-[10px] text-outline">{formatSize(selectedFile.size)}</p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1 text-outline hover:text-excitement transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="bg-surface-container-low rounded-2xl p-4 text-center cursor-pointer hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-2xl text-outline mx-auto block mb-1">attach_file</span>
              <p className="text-xs text-outline">Attach a file (optional)</p>
              <p className="text-[10px] text-outline/60">PDF, DOCX, PNG up to 25MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ALLOWED_FILE_TYPES.join(',')}
            onChange={e => handleFileSelect(e.target.files?.[0] ?? null)}
          />

          {error && <p className="text-sm text-excitement bg-excitement-10 rounded-xl px-4 py-2">{error}</p>}
        </div>

        <div className="px-6 py-4 flex gap-3 bg-surface-container-low/50">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-full text-sm font-bold text-white shadow-[0px_2px_8px_rgba(77,85,106,0.06)] disabled:opacity-60 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #2226F7 0%, #00D6A3 100%)' }}
          >
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  )
}
