'use client'

import { useEffect, useState, useCallback } from 'react'
import { ROLE_LABELS } from '@/lib/permissions'

interface AuditEntry {
  id: string
  timestamp: string
  actor_id: string
  actor_name: string
  actor_role: string
  event_type: string
  resource_type: string | null
  resource_id: string | null
  old_value: unknown
  new_value: unknown
}

interface Props {
  actors: { id: string; name: string }[]
}

const EVENT_COLORS: Record<string, string> = {
  'user.create': 'bg-emerald-50 text-emerald-700',
  'user.update': 'bg-blue-50 text-blue-700',
  'user.deactivate': 'bg-amber-50 text-amber-700',
  'user.reactivate': 'bg-emerald-50 text-emerald-700',
  'team.create': 'bg-indigo-50 text-indigo-700',
  'team.update': 'bg-blue-50 text-blue-700',
  'team.delete': 'bg-red-50 text-red-700',
  'settings.update': 'bg-violet-50 text-violet-700',
  'export.generated': 'bg-slate-100 text-slate-600',
}

function formatTimestamp(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

export default function AuditTrailClient({ actors }: Props) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [eventTypes, setEventTypes] = useState<string[]>([])

  // Filters
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [eventType, setEventType] = useState('')
  const [actorId, setActorId] = useState('')
  const limit = 20

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (eventType) params.set('event_type', eventType)
    if (actorId) params.set('actor_id', actorId)

    const res = await fetch(`/api/admin/audit-trail?${params}`)
    const data = await res.json()
    setEntries(data.entries ?? [])
    setTotal(data.total ?? 0)
    setTotalPages(data.total_pages ?? 1)
    setEventTypes(data.event_types ?? [])
    setLoading(false)
  }, [page, dateFrom, dateTo, eventType, actorId])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  function applyFilters() {
    if (page === 1) {
      fetchEntries()
    } else {
      setPage(1)
    }
  }

  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  // Generate page numbers
  const pageNumbers: (number | string)[] = []
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i)
  } else {
    pageNumbers.push(1)
    if (page > 3) pageNumbers.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pageNumbers.push(i)
    if (page < totalPages - 2) pageNumbers.push('...')
    pageNumbers.push(totalPages)
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-[1.5rem] font-bold tracking-tight text-on-surface mb-2">Audit Trail</h1>
        <p className="text-on-surface-variant font-medium">Read-only log of structural changes</p>
      </header>

      {/* Filter Bar */}
      <section className="mb-8 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-4">
            Date From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full bg-white h-12 px-5 rounded-full shadow-[0px_4px_12px_rgba(77,85,106,0.04)] border-0 text-sm font-medium text-on-surface focus:ring-2 focus:ring-integrity/20"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-4">
            Date To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full bg-white h-12 px-5 rounded-full shadow-[0px_4px_12px_rgba(77,85,106,0.04)] border-0 text-sm font-medium text-on-surface focus:ring-2 focus:ring-integrity/20"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-4">
            Event Type
          </label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full bg-white h-12 px-5 rounded-full shadow-[0px_4px_12px_rgba(77,85,106,0.04)] border-0 text-sm font-medium text-on-surface focus:ring-2 focus:ring-integrity/20 appearance-none"
          >
            <option value="">All Events</option>
            {eventTypes.map((t) => (
              <option key={t} value={t}>{t.replace(/\./g, ' ').replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-4">
            Actor
          </label>
          <select
            value={actorId}
            onChange={(e) => setActorId(e.target.value)}
            className="w-full bg-white h-12 px-5 rounded-full shadow-[0px_4px_12px_rgba(77,85,106,0.04)] border-0 text-sm font-medium text-on-surface focus:ring-2 focus:ring-integrity/20 appearance-none"
          >
            <option value="">Any Actor</option>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={applyFilters}
          className="h-12 px-8 bg-integrity text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Apply Filters
        </button>
      </section>

      {/* Audit Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-integrity border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-on-surface-variant text-lg font-medium">No audit entries found</p>
          <p className="text-on-surface-variant/60 text-sm mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <section className="space-y-1">
          {/* Table Header */}
          <div className="hidden lg:grid grid-cols-[1.5fr_2fr_1.5fr_3fr_1.5fr_1.5fr] gap-4 px-8 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            <div>Timestamp</div>
            <div>Actor</div>
            <div>Event Type</div>
            <div>Description</div>
            <div>Old Value</div>
            <div>New Value</div>
          </div>

          {/* Rows */}
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="lg:grid lg:grid-cols-[1.5fr_2fr_1.5fr_3fr_1.5fr_1.5fr] gap-4 px-6 lg:px-8 py-5 bg-white rounded-2xl items-center shadow-[0px_4px_12px_rgba(77,85,106,0.03)] hover:bg-slate-50 transition-colors flex flex-col lg:flex-row"
            >
              {/* Timestamp */}
              <div className="text-sm text-on-surface-variant font-medium">
                {formatTimestamp(entry.timestamp)}
              </div>

              {/* Actor */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-integrity flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {entry.actor_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{entry.actor_name}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                    {ROLE_LABELS[entry.actor_role as keyof typeof ROLE_LABELS] ?? entry.actor_role}
                  </p>
                </div>
              </div>

              {/* Event Type */}
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    EVENT_COLORS[entry.event_type] ?? 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {entry.event_type.replace(/\./g, ' ').replace(/_/g, ' ')}
                </span>
              </div>

              {/* Description */}
              <div className="text-sm text-on-surface font-medium">
                {entry.resource_type && entry.resource_id
                  ? `${entry.event_type.replace(/\./g, ' ')} on ${entry.resource_type} ${entry.resource_id.slice(0, 8)}…`
                  : entry.event_type.replace(/\./g, ' ').replace(/_/g, ' ')}
              </div>

              {/* Old Value */}
              <div className="text-sm font-mono text-red-400/70 line-through truncate" title={formatValue(entry.old_value)}>
                {formatValue(entry.old_value)}
              </div>

              {/* New Value */}
              <div className="text-sm font-mono text-[#363e52] font-bold truncate" title={formatValue(entry.new_value)}>
                {formatValue(entry.new_value)}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Pagination */}
      {total > 0 && (
        <footer className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 px-4 lg:px-8">
          <div className="text-sm text-on-surface-variant font-medium">
            Showing <span className="font-bold text-on-surface">{startItem} - {endItem}</span> of{' '}
            <span className="font-bold text-on-surface">{total.toLocaleString()}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-[#eceef0] transition-colors disabled:opacity-30"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {pageNumbers.map((n, i) =>
              typeof n === 'string' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-on-surface-variant">…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full font-bold transition-colors ${
                    n === page
                      ? 'bg-integrity text-white shadow-md'
                      : 'text-on-surface hover:bg-[#eceef0]'
                  }`}
                >
                  {n}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-[#eceef0] transition-colors disabled:opacity-30"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
