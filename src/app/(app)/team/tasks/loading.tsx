export default function TeamLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="skeleton h-7 w-32 rounded-full" />
        <div className="flex gap-2">
          <div className="skeleton h-9 w-24 rounded-full" />
          <div className="skeleton h-9 w-28 rounded-full" />
        </div>
      </div>
      <div className="flex gap-3 flex-wrap">
        {[80, 96, 72, 88].map((w, i) => (
          <div key={i} className="skeleton h-8 rounded-full" style={{ width: `${w}px` }} />
        ))}
      </div>
      <div className="bg-surface-container rounded-2xl overflow-hidden">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-outline-variant/20 last:border-0">
            <div className="skeleton h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="skeleton h-4 rounded-full" style={{ width: `${35 + (i % 5) * 10}%` }} />
              <div className="skeleton h-3 w-20 rounded-full" />
            </div>
            <div className="skeleton h-6 w-16 rounded-full" />
            <div className="skeleton h-6 w-16 rounded-full" />
            <div className="skeleton h-4 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
