'use client'

import { useCallback, useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open && !el.open) el.showModal()
    else if (!open && el.open) el.close()
  }, [open])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) onCancel()
    },
    [onCancel],
  )

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onClose={onCancel}
      className="backdrop:bg-black/40 bg-transparent p-0 m-auto rounded-2xl outline-none"
    >
      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient w-[min(420px,90vw)] p-8">
        <h2 className="text-lg font-bold text-on-surface mb-2">{title}</h2>
        <p className="text-sm text-on-surface-variant leading-relaxed mb-8">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-colors ${
              destructive
                ? 'bg-error hover:bg-error/90'
                : 'bg-gradient-to-br from-[#4d556a] to-[#656d84] hover:opacity-90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}

/* Toast-style inline notification (replaces alert()) */
interface ToastProps {
  message: string | null
  type?: 'error' | 'success'
  onDismiss: () => void
}

export function InlineToast({ message, type = 'error', onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [message, onDismiss])

  if (!message) return null

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-sm font-semibold shadow-lg animate-in slide-in-from-bottom-4 ${
        type === 'error'
          ? 'bg-error-container text-on-error-container'
          : 'bg-primary-container text-on-primary-container'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-base">
          {type === 'error' ? 'error' : 'check_circle'}
        </span>
        {message}
        <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100">
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </div>
  )
}
