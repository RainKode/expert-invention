'use client'

import { useState, useEffect, useCallback } from 'react'

interface FilePreviewModalProps {
  open: boolean
  onClose: () => void
  fileId: string
  filename: string
  fileType: string
  fileSize: number
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FilePreviewModal({
  open,
  onClose,
  fileId,
  filename,
  fileType,
  fileSize,
}: FilePreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [zoom, setZoom] = useState(100)

  const isImage = fileType.startsWith('image/')
  const isPdf = fileType === 'application/pdf'
  const isPreviewable = isImage || isPdf

  const fetchPreview = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/files/${fileId}/preview`)
      if (!res.ok) {
        setError('Could not load preview')
        return
      }
      const data = await res.json()
      setPreviewUrl(data.url)
    } catch {
      setError('Preview failed')
    } finally {
      setLoading(false)
    }
  }, [fileId])

  useEffect(() => {
    if (open && isPreviewable) {
      setZoom(100)
      fetchPreview()
    }
    return () => {
      setPreviewUrl(null)
      setError('')
    }
  }, [open, isPreviewable, fetchPreview])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleDownload = () => {
    window.open(`/api/files/${fileId}`, '_blank')
  }

  if (!open) return null

  const fileIcon = isPdf ? 'picture_as_pdf' : isImage ? 'image' : 'description'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      {/* Scrim overlay */}
      <div
        className="absolute inset-0 bg-on-surface/40"
        onClick={onClose}
      />

      {/* Modal panel — glass */}
      <div className="relative w-full max-w-5xl h-[85vh] rounded-[24px] flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          boxShadow: '0px 32px 64px rgba(77, 85, 106, 0.15)',
        }}
      >
        {/* Header */}
        <header
          className="flex items-center justify-between px-10 py-6"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(198, 198, 205, 0.05)',
          }}
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-2xl text-white shadow-lg">
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {fileIcon}
              </span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-extrabold text-primary tracking-tight leading-none mb-1 line-clamp-1">
                {filename}
              </h2>
              <span className="text-xs font-semibold text-on-surface-variant/70 uppercase tracking-widest">
                {formatSize(fileSize)} • {fileType.split('/').pop()?.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-2.5 bg-tertiary-fixed text-on-tertiary-fixed font-bold rounded-full hover:brightness-95 transition-all text-sm shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Download
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high/30 hover:bg-surface-container-high/60 transition-all text-primary"
            >
              <span className="material-symbols-outlined font-bold">close</span>
            </button>
          </div>
        </header>

        {/* Preview content area */}
        <div className="flex-1 overflow-y-auto p-12 md:p-16 flex flex-col items-center gap-12 relative"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(118,119,125,0.2) transparent' }}
        >
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl animate-spin text-outline">
                progress_activity
              </span>
            </div>
          )}

          {error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
              <span className="material-symbols-outlined text-4xl text-outline">error_outline</span>
              <p className="text-sm text-outline">{error}</p>
              <button
                onClick={handleDownload}
                className="px-6 py-2.5 rounded-full text-sm font-bold bg-integrity text-white"
              >
                Download Instead
              </button>
            </div>
          )}

          {!loading && !error && previewUrl && isImage && (
            <div className="flex items-center justify-center flex-1 w-full">
              <img
                src={previewUrl}
                alt={filename}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                style={{ transform: `scale(${zoom / 100})`, transition: 'transform 200ms ease' }}
              />
            </div>
          )}

          {!loading && !error && previewUrl && isPdf && (
            <iframe
              src={`${previewUrl}#toolbar=0`}
              className="w-full max-w-[760px] flex-1 rounded-sm shadow-2xl bg-white"
              title={filename}
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 200ms ease' }}
            />
          )}

          {!loading && !error && !isPreviewable && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
              <span className="material-symbols-outlined text-6xl text-outline/40">description</span>
              <p className="text-lg font-bold text-on-surface">{filename}</p>
              <p className="text-sm text-outline">This file type cannot be previewed in the browser.</p>
              <button
                onClick={handleDownload}
                className="px-6 py-2.5 rounded-full text-sm font-bold bg-integrity text-white"
              >
                <span className="material-symbols-outlined text-lg mr-1 align-middle">download</span>
                Download File
              </button>
            </div>
          )}
        </div>

        {/* Floating control bar — Apple-style */}
        {isPreviewable && previewUrl && !loading && !error && (
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[110]">
            <div
              className="h-[56px] px-4 rounded-full flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
              }}
            >
              {/* Zoom controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom(z => Math.max(25, z - 25))}
                  className="w-9 h-9 flex items-center justify-center hover:bg-white/80 rounded-full transition-all text-primary"
                >
                  <span className="material-symbols-outlined text-[20px]">remove_circle</span>
                </button>
                <span className="w-12 text-center text-xs font-bold text-primary">{zoom}%</span>
                <button
                  onClick={() => setZoom(z => Math.min(200, z + 25))}
                  className="w-9 h-9 flex items-center justify-center hover:bg-white/80 rounded-full transition-all text-primary"
                >
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                </button>
              </div>

              <span className="w-[1px] h-6 bg-outline-variant/30 mx-2" />

              {/* Action icons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom(100)}
                  className="w-9 h-9 flex items-center justify-center hover:bg-white/80 rounded-full transition-all text-primary"
                  title="Reset zoom"
                >
                  <span className="material-symbols-outlined text-[20px]">fit_screen</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="w-9 h-9 flex items-center justify-center hover:bg-white/80 rounded-full transition-all text-primary"
                  title="Download"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
