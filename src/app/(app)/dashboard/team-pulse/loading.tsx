export default function DashboardSubLoading() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-7 w-40 rounded-full" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface-container rounded-2xl p-5 space-y-3">
            <div className="skeleton h-4 w-24 rounded-full" />
            <div className="skeleton h-8 w-16 rounded-full" />
          </div>
        ))}
      </div>
      <div className="bg-surface-container rounded-2xl p-6 space-y-4">
        <div className="skeleton h-5 w-32 rounded-full" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-outline-variant/20 last:border-0">
            <div className="skeleton h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="skeleton h-4 rounded-full" style={{ width: `${40 + i * 8}%` }} />
              <div className="skeleton h-3 w-24 rounded-full" />
            </div>
            <div className="skeleton h-5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
