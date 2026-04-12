export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="skeleton h-8 w-56 rounded-full mb-2" />
        <div className="skeleton h-4 w-40 rounded-full" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface-container rounded-2xl p-5 space-y-3">
            <div className="skeleton h-3 w-20 rounded-full" />
            <div className="skeleton h-9 w-12 rounded-full" />
            <div className="skeleton h-3 w-28 rounded-full" />
          </div>
        ))}
      </div>
      {/* Two column content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface-container rounded-2xl p-5 space-y-4">
          <div className="skeleton h-5 w-32 rounded-full" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="skeleton h-2 w-2 rounded-full flex-shrink-0" />
              <div className="skeleton h-4 flex-1 rounded-full" />
              <div className="skeleton h-5 w-14 rounded-full" />
            </div>
          ))}
        </div>
        <div className="bg-surface-container rounded-2xl p-5 space-y-4">
          <div className="skeleton h-5 w-28 rounded-full" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="skeleton h-8 w-8 rounded-full flex-shrink-0" />
              <div className="space-y-1 flex-1">
                <div className="skeleton h-4 w-full rounded-full" />
                <div className="skeleton h-3 w-3/4 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
