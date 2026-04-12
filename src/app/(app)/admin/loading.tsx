export default function AdminLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="skeleton h-7 w-36 rounded-full" />
        <div className="skeleton h-9 w-28 rounded-full" />
      </div>
      {/* Search/filter bar */}
      <div className="flex gap-3">
        <div className="skeleton h-11 flex-1 rounded-full" />
        <div className="skeleton h-11 w-32 rounded-full" />
      </div>
      {/* Table */}
      <div className="bg-surface-container rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-outline-variant/30">
          {[140, 120, 100, 80, 80].map((w, i) => (
            <div key={i} className="skeleton h-3 rounded-full" style={{ width: `${w}px` }} />
          ))}
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-outline-variant/20 last:border-0">
            <div className="skeleton h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="skeleton h-4 w-36 rounded-full" />
              <div className="skeleton h-3 w-48 rounded-full" />
            </div>
            <div className="skeleton h-6 w-20 rounded-full" />
            <div className="skeleton h-6 w-16 rounded-full" />
            <div className="skeleton h-4 w-4 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  )
}
