export default function BoardLoading() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-7 w-24 rounded-full" />
        <div className="flex gap-2">
          <div className="skeleton h-9 w-20 rounded-full" />
          <div className="skeleton h-9 w-28 rounded-full" />
        </div>
      </div>
      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {['To Do', 'In Progress', 'Review', 'Done'].map((col, ci) => (
          <div key={ci} className="flex-shrink-0 w-72 space-y-3">
            <div className="flex items-center gap-2">
              <div className="skeleton h-5 w-24 rounded-full" />
              <div className="skeleton h-5 w-6 rounded-full" />
            </div>
            {[...Array(ci === 1 ? 4 : ci === 0 ? 3 : 2)].map((_, i) => (
              <div key={i} className="bg-surface-container rounded-2xl p-4 space-y-3">
                <div className="skeleton h-4 rounded-full" style={{ width: `${55 + i * 10}%` }} />
                <div className="skeleton h-3 w-3/4 rounded-full" />
                <div className="flex items-center justify-between">
                  <div className="skeleton h-5 w-14 rounded-full" />
                  <div className="skeleton h-6 w-6 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
