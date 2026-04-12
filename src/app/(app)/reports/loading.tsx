export default function ReportsLoading() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-7 w-28 rounded-full" />
      {/* Filter row */}
      <div className="flex gap-3 flex-wrap">
        {[120, 100, 80, 80].map((w, i) => (
          <div key={i} className="skeleton h-9 rounded-full" style={{ width: `${w}px` }} />
        ))}
        <div className="skeleton h-9 w-24 rounded-full ml-auto" />
      </div>
      {/* Chart placeholder */}
      <div className="bg-surface-container rounded-2xl p-6 space-y-3">
        <div className="skeleton h-5 w-40 rounded-full" />
        <div className="skeleton h-48 w-full rounded-xl" />
      </div>
      {/* Table */}
      <div className="bg-surface-container rounded-2xl overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-outline-variant/20 last:border-0">
            <div className="skeleton h-4 flex-1 rounded-full" style={{ maxWidth: `${30 + i * 8}%` }} />
            <div className="skeleton h-4 w-16 rounded-full" />
            <div className="skeleton h-4 w-16 rounded-full" />
            <div className="skeleton h-4 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
