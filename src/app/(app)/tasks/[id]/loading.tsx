export default function TaskDetailLoading() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back button + title */}
      <div className="flex items-center gap-3">
        <div className="skeleton w-8 h-8 rounded-full" />
        <div className="skeleton h-7 w-64 rounded-full" />
      </div>
      {/* Meta bar */}
      <div className="flex gap-3 flex-wrap">
        <div className="skeleton h-8 w-20 rounded-full" />
        <div className="skeleton h-8 w-24 rounded-full" />
        <div className="skeleton h-8 w-28 rounded-full" />
      </div>
      {/* Main content card */}
      <div className="bg-white rounded-2xl p-8 space-y-5">
        <div className="skeleton h-5 w-24 rounded-full" />
        <div className="skeleton h-4 w-full rounded-full" />
        <div className="skeleton h-4 w-5/6 rounded-full" />
        <div className="skeleton h-4 w-2/3 rounded-full" />
      </div>
      {/* Sidebar-like details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 space-y-4">
          <div className="skeleton h-5 w-20 rounded-full" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="skeleton h-4 w-20 rounded-full" />
              <div className="skeleton h-4 w-28 rounded-full" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-6 space-y-4">
          <div className="skeleton h-5 w-24 rounded-full" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
              <div className="skeleton h-4 flex-1 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
