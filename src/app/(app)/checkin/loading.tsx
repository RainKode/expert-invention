export default function CheckinLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="skeleton h-8 w-44 rounded-full" />
      <div className="skeleton h-4 w-64 rounded-full" />
      <div className="bg-surface-container rounded-2xl p-6 space-y-4">
        <div className="skeleton h-5 w-36 rounded-full" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-outline-variant/20 last:border-0">
            <div className="skeleton h-4 w-4 rounded-sm flex-shrink-0" />
            <div className="skeleton h-4 flex-1 rounded-full" />
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
      <div className="bg-surface-container rounded-2xl p-6 space-y-4">
        <div className="skeleton h-5 w-32 rounded-full" />
        <div className="skeleton h-24 w-full rounded-xl" />
      </div>
      <div className="skeleton h-11 w-32 rounded-full" />
    </div>
  )
}
