export default function TeamPlansLoading() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-7 w-32 rounded-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-surface-container rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="skeleton h-9 w-9 rounded-full flex-shrink-0" />
              <div className="space-y-1 flex-1">
                <div className="skeleton h-4 w-28 rounded-full" />
                <div className="skeleton h-3 w-20 rounded-full" />
              </div>
              <div className="skeleton h-6 w-20 rounded-full" />
            </div>
            <div className="space-y-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="skeleton h-3 flex-1 rounded-full" />
                  <div className="skeleton h-4 w-8 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
