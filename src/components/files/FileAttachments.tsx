'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { FILE_TYPE_ICONS, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/types'

const FilePreviewModal = dynamic(() => import('@/components/files/FilePreviewModal'), { ssr: false })

interface FileRecord {
  id: string
  filename: string
  file_type: string
  file_size: number
  created_at: string
  uploader?: { id: string; name: string } | null
}

interface FileAttachmentsProps {
  taskId?: string
  wrapUpId?: string
  context?: 'attachment' | 'completion_report' | 'wrapup'
  readOnly?: boolean
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType: string) {
  return FILE_TYPE_ICONS[mimeType] ?? { icon: 'description', color: 'text-outline' }
}

export default function FileAttachments({
  taskId,
  wrapUpId,
  context = 'attachment',
  readOnly = false,
}: FileAttachmentsProps) {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchFiles = useCallback(async () => {
    const params = new URLSearchParams()
    if (taskId) params.set('task_id', taskId)
    if (wrapUpId) params.set('wrap_up_id', wrapUpId)

    const res = await fetch(`/api/files?${params}`)
    if (res.ok) {
      const data = await res.json()
      setFiles(data.files ?? [])
    }
    setLoading(false)
  }, [taskId, wrapUpId])

  useEffect(() => {
    if (taskId || wrapUpId) fetchFiles()
  }, [taskId, wrapUpId, fetchFiles])

  const uploadFile = useCallback(async (file: File) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setUploadError(`"${file.name}" — file type not supported`)
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`"${file.name}" exceeds 25MB limit`)
      return
    }

    setUploading(true)
    setUploadError('')

    const form = new FormData()
    form.append('file', file)
    if (taskId) form.append('task_id', taskId)
    if (wrapUpId) form.append('wrap_up_id', wrapUpId)
    form.append('context', context)

    try {
      const res = await fetch('/api/files', { method: 'POST', body: form })
      if (!res.ok) {
        const d = await res.json()
        setUploadError(d.error ?? 'Upload failed')
        return
      }
      await fetchFiles()
    } catch {
      setUploadError('Upload failed')
    } finally {
      setUploading(false)
    }
  }, [taskId, wrapUpId, context, fetchFiles])

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return
      Array.from(fileList).forEach(uploadFile)
    },
    [uploadFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragging(false), [])

  const filteredFiles = context === 'attachment'
    ? files
    : files.filter(f => {
        // For the full attachment view show all, for specific context filter
        return true
      })

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-medium text-on-surface-variant">Attachments</h3>
          <span className="text-sm font-medium text-on-surface-variant">({files.length})</span>
        </div>

        <div className="space-y-4">
          {/* Upload zone */}
          {!readOnly && (
            <div className="space-y-2">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => inputRef.current?.click()}
                className={`h-[80px] bg-surface-container-low rounded-[12px] shadow-[0px_2px_12px_rgba(77,85,106,0.04)] flex items-center justify-center cursor-pointer group transition-all ${
                  dragging
                    ? 'bg-surface-container-high border-outline-variant/30'
                    : 'border border-dashed border-outline-variant/15 hover:bg-surface-container-high hover:border-outline-variant/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {uploading ? (
                    <span className="material-symbols-outlined text-[32px] text-on-surface-variant animate-spin">
                      progress_activity
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[32px] text-on-surface-variant">
                      cloud_upload
                    </span>
                  )}
                  <p className="text-sm text-on-surface-variant">
                    {uploading
                      ? 'Uploading…'
                      : <>Drag files here or <span className="text-integrity font-semibold hover:underline">browse</span></>}
                  </p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  multiple
                  onChange={e => handleFiles(e.target.files)}
                />
              </div>
              <p className="text-[12px] text-on-surface-variant">
                All file types accepted · Max 25MB per file.
              </p>
            </div>
          )}

          {uploadError && (
            <p className="text-sm text-excitement bg-excitement-10 rounded-xl px-4 py-2">{uploadError}</p>
          )}

          {/* File list */}
          {loading ? (
            <div className="py-4 text-center">
              <span className="material-symbols-outlined animate-spin text-outline">progress_activity</span>
            </div>
          ) : files.length > 0 ? (
            <div className="space-y-1">
              {files.map(f => {
                const icon = getFileIcon(f.file_type)
                const canPreview = f.file_type.startsWith('image/') || f.file_type === 'application/pdf'
                return (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-3 bg-white rounded-[8px] shadow-[0px_2px_8px_rgba(77,85,106,0.04)] hover:bg-surface-container-high transition-colors group cursor-pointer"
                    onClick={() => canPreview ? setPreviewFile(f) : window.open(`/api/files/${f.id}`, '_blank')}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined ${icon.color}`}>{icon.icon}</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-on-surface">{f.filename}</span>
                        <span className="text-xs text-on-surface-variant">{formatSize(f.file_size)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      {canPreview && (
                        <button
                          onClick={e => { e.stopPropagation(); setPreviewFile(f) }}
                          className="p-1 hover:bg-white rounded-md"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); window.open(`/api/files/${f.id}`, '_blank') }}
                        className="p-1 hover:bg-white rounded-md"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            !readOnly ? null : (
              <p className="text-sm text-outline/60 text-center py-4">No attachments</p>
            )
          )}
        </div>
      </div>

      {/* Preview modal */}
      {previewFile && (
        <FilePreviewModal
          open={!!previewFile}
          onClose={() => setPreviewFile(null)}
          fileId={previewFile.id}
          filename={previewFile.filename}
          fileType={previewFile.file_type}
          fileSize={previewFile.file_size}
        />
      )}
    </>
  )
}
