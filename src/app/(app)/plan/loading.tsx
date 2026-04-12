export default function PlanLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="skeleton h-7 w-36 rounded-full" />
        <div className="skeleton h-9 w-28 rounded-full" />
      </div>
      {/* Week grid */}
      <div className="bg-surface-container rounded-2xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b border-outline-variant/20">
          <div className="p-3" />
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="p-3 text-center">
              <div className="skeleton h-4 w-8 rounded-full mx-auto" />
            </div>
          ))}
        </div>
        {/* Task rows */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="grid grid-cols-8 border-b border-outline-variant/10 last:border-0">
            <div className="p-3 flex items-center">
              <div className="skeleton h-4 rounded-full" style={{ width: `${50 + i * 8}%` }} />
            </div>
            {[...Array(7)].map((_, j) => (
              <div key={j} className="p-2 flex items-center justify-center">
                {(i + j) % 3 === 0 ? (
                  <div className="skeleton h-7 w-10 rounded-lg" />
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
