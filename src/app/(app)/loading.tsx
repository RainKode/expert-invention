// Shared app-level loading — shown during navigation while page data loads
export default function AppLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-7 w-48 rounded-full" />
          <div className="skeleton h-4 w-72 rounded-full" />
        </div>
        <div className="skeleton h-10 w-28 rounded-full" />
      </div>
      {/* Cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface-container rounded-2xl p-5 space-y-3">
            <div className="skeleton h-4 w-24 rounded-full" />
            <div className="skeleton h-8 w-16 rounded-full" />
            <div className="skeleton h-3 w-32 rounded-full" />
          </div>
        ))}
      </div>
      {/* Content block */}
      <div className="bg-surface-container rounded-2xl p-6 space-y-4">
        <div className="skeleton h-5 w-36 rounded-full" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-outline-variant/30 last:border-0">
            <div className="skeleton h-4 w-4 rounded-sm flex-shrink-0" />
            <div className="skeleton h-4 flex-1 rounded-full" style={{ maxWidth: `${60 + i * 7}%` }} />
            <div className="skeleton h-6 w-16 rounded-full flex-shrink-0" />
            <div className="skeleton h-4 w-20 rounded-full flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
