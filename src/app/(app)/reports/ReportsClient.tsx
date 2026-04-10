'use client'

import { useState, useCallback } from 'react'
import type { Role } from '@/types'

// ─── Types ──────────────────────────────────────────────────────────────────

type ReportType =
  | 'weekly-team'
  | 'individual-employee'
  | 'billable-hours'
  | 'task-export'
  | 'system-activity'

type ExportFormat = 'pdf' | 'csv'

interface ReportTypeOption {
  id: ReportType
  label: string
  description: string
  icon: string
  csvOnly?: boolean
  adminOnly?: boolean
  needsTeam?: boolean
  needsEmployee?: boolean
}

interface GeneratedResult {
  url: string
  filename: string
  format: ExportFormat
  reportLabel: string
  dateRange: string
  generatedAt: Date
}

interface ReportsClientProps {
  userId: string
  userName: string
  userRole: Role
  isAdmin: boolean
  teams: { id: string; name: string }[]
  employees: { id: string; name: string }[]
}

// ─── Report type definitions ────────────────────────────────────────────────

const REPORT_TYPES: ReportTypeOption[] = [
  { id: 'weekly-team', label: 'Weekly Team Performance', description: 'Efficiency and output metrics by team.', icon: 'analytics', needsTeam: true },
  { id: 'individual-employee', label: 'Individual Employee', description: 'Detailed breakdown of individual metrics.', icon: 'person', needsEmployee: true },
  { id: 'billable-hours', label: 'Billable Hours Summary', description: 'Client work and project time logs.', icon: 'schedule', needsTeam: true },
  { id: 'task-export', label: 'Full Task Export', description: 'CSV export of all completed tasks.', icon: 'file_export', csvOnly: true, needsTeam: true },
  { id: 'system-activity', label: 'System Activity', description: 'Audit logs and system-wide changes.', icon: 'history', csvOnly: true, adminOnly: true },
]

// ─── Helper ─────────────────────────────────────────────────────────────────

function getMonday(): string {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d.toISOString().split('T')[0]
}

function getSunday(monday: string): string {
  const d = new Date(monday)
  d.setDate(d.getDate() + 6)
  return d.toISOString().split('T')[0]
}

function formatDateDisplay(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function timeAgo(date: Date): string {
  const diff = Math.round((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
  return `${Math.floor(diff / 86400)} days ago`
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ReportsClient({
  userId,
  userName,
  userRole,
  isAdmin,
  teams,
  employees,
}: ReportsClientProps) {
  const monday = getMonday()

  const [selectedType, setSelectedType] = useState<ReportType>('weekly-team')
  const [dateFrom, setDateFrom] = useState(monday)
  const [dateTo, setDateTo] = useState(getSunday(monday))
  const [teamId, setTeamId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<GeneratedResult | null>(null)

  const currentType = REPORT_TYPES.find(t => t.id === selectedType)!
  const effectiveFormat: ExportFormat = currentType.csvOnly ? 'csv' : format

  // Filter out admin-only reports for non-admins
  const availableTypes = REPORT_TYPES.filter(t => !t.adminOnly || isAdmin)

  const handleGenerate = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const endpoint = `/api/reports/${selectedType}`
      const body: Record<string, string> = {
        date_from: dateFrom,
        date_to: dateTo,
        format: effectiveFormat,
      }

      if (currentType.needsTeam && teamId) body.team_id = teamId
      if (currentType.needsEmployee) {
        if (!employeeId) {
          setError('Please select an employee.')
          setLoading(false)
          return
        }
        body.employee_id = employeeId
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error ?? `Failed to generate report (${res.status})`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const ext = effectiveFormat === 'pdf' ? 'pdf' : 'csv'
      const filename = `${selectedType}-${dateFrom}.${ext}`

      setLastResult({
        url,
        filename,
        format: effectiveFormat,
        reportLabel: currentType.label,
        dateRange: `${formatDateDisplay(dateFrom)} – ${formatDateDisplay(dateTo)}`,
        generatedAt: new Date(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [selectedType, dateFrom, dateTo, teamId, employeeId, effectiveFormat, currentType])

  const handleDownload = useCallback(() => {
    if (!lastResult) return
    const a = document.createElement('a')
    a.href = lastResult.url
    a.download = lastResult.filename
    a.click()
  }, [lastResult])

  return (
    <div className="flex flex-col gap-10 p-12 pt-8">
      {/* Page Header */}
      <div className="max-w-4xl">
        <h1 className="text-[1.5rem] font-headline font-bold text-on-surface tracking-tight leading-none mb-3">
          Reports
        </h1>
        <p className="text-on-surface-variant text-lg">
          Generate and download reports for your team.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Left: Report Type Selector */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-2">
            Select Report Type
          </h3>

          {availableTypes.map((rt) => {
            const isSelected = selectedType === rt.id
            return (
              <button
                key={rt.id}
                onClick={() => setSelectedType(rt.id)}
                className={`relative w-full text-left flex items-center gap-6 p-6 rounded-lg transition-all group overflow-hidden ${
                  isSelected
                    ? 'bg-surface-container-low'
                    : 'bg-surface-container-lowest hover:bg-surface-container'
                }`}
              >
                {isSelected && <div className="active-tab-indicator" />}
                <div
                  className={`w-12 h-12 flex items-center justify-center rounded-2xl ${
                    isSelected
                      ? 'bg-primary-container text-white'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined">{rt.icon}</span>
                </div>
                <div className="flex-grow">
                  <h4 className="font-bold text-on-surface">{rt.label}</h4>
                  <p className="text-sm text-on-surface-variant">{rt.description}</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-primary' : 'border-outline-variant'
                  }`}
                >
                  {isSelected && <div className="w-3 h-3 rounded-full bg-primary" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Right: Parameters and Action */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-8">
          {/* Parameters Card */}
          <div className="bg-surface-container-lowest rounded-xl p-10 shadow-[0px_24px_48px_rgba(77,85,106,0.06)] flex flex-col gap-10">
            <h3 className="text-lg font-bold text-on-surface">Report Parameters</h3>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-on-surface-variant ml-2">From</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/50">
                    calendar_today
                  </span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-full py-4 pl-14 pr-6 font-medium focus:ring-2 focus:ring-primary/10 text-on-surface"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-on-surface-variant ml-2">To</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/50">
                    calendar_today
                  </span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-full py-4 pl-14 pr-6 font-medium focus:ring-2 focus:ring-primary/10 text-on-surface"
                  />
                </div>
              </div>
            </div>

            {/* Team selector — shown for team/billable/task-export reports */}
            {currentType.needsTeam && (
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-on-surface-variant ml-2">Team Selector</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/50">
                    group
                  </span>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-full py-4 pl-14 pr-10 font-medium focus:ring-2 focus:ring-primary/10 text-on-surface appearance-none cursor-pointer"
                  >
                    <option value="">All Teams</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/50 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>
            )}

            {/* Employee selector — shown for individual employee report */}
            {currentType.needsEmployee && (
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-on-surface-variant ml-2">Employee</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/50">
                    person
                  </span>
                  <select
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-full py-4 pl-14 pr-10 font-medium focus:ring-2 focus:ring-primary/10 text-on-surface appearance-none cursor-pointer"
                  >
                    <option value="">Select employee…</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/50 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>
            )}

            {/* Export Format Toggle — hidden for CSV-only report types */}
            {!currentType.csvOnly && (
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-on-surface-variant ml-2">Export Format</label>
                <div className="flex bg-surface-container-low p-1.5 rounded-full w-fit">
                  <button
                    onClick={() => setFormat('pdf')}
                    className={`px-8 py-2.5 rounded-full font-bold text-sm transition-all ${
                      format === 'pdf'
                        ? 'bg-white shadow-sm text-on-surface'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => setFormat('csv')}
                    className={`px-8 py-2.5 rounded-full font-bold text-sm transition-all ${
                      format === 'csv'
                        ? 'bg-white shadow-sm text-on-surface'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    CSV
                  </button>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <p className="text-error text-sm font-medium px-2">{error}</p>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="primary-gradient text-white font-bold py-5 rounded-full shadow-lg shadow-primary-container/20 hover:scale-[1.02] transition-transform active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Generating…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">magic_button</span>
                  Generate Report
                </>
              )}
            </button>
          </div>

          {/* Last Generated Result */}
          {lastResult && (
            <div className="bg-surface-container-low/50 rounded-xl p-8 flex flex-col gap-6">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Last Generated Result
                </h3>
                <span className="text-xs text-on-surface-variant">
                  {timeAgo(lastResult.generatedAt)}
                </span>
              </div>
              <div className="bg-white p-6 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center">
                    <span className="material-symbols-outlined">
                      {lastResult.format === 'pdf' ? 'picture_as_pdf' : 'table_view'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface">{lastResult.reportLabel}</h4>
                    <p className="text-xs text-on-surface-variant">{lastResult.dateRange}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-outline-variant/30 text-on-surface-variant font-bold text-xs hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Download {lastResult.format.toUpperCase()}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
