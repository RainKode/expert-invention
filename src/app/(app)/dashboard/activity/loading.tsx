export default function ActivityLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="skeleton h-8 w-40 rounded-full mb-2" />
        <div className="skeleton h-4 w-48 rounded-full" />
      </div>
      {/* Filter pills */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton h-10 w-28 rounded-full flex-shrink-0" />
        ))}
      </div>
      {/* Event cards */}
      <div className="space-y-4 max-w-5xl">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 flex items-center gap-4">
            <div className="skeleton w-12 h-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4 rounded-full" />
              <div className="skeleton h-3 w-20 rounded-full" />
            </div>
            <div className="skeleton h-3 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
