export default function WrapupLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="skeleton h-8 w-44 rounded-full" />
      <div className="skeleton h-4 w-56 rounded-full" />
      <div className="bg-surface-container rounded-2xl p-6 space-y-4">
        <div className="skeleton h-5 w-40 rounded-full" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-outline-variant/20 last:border-0">
            <div className="skeleton h-4 flex-1 rounded-full" />
            <div className="skeleton h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="bg-surface-container rounded-2xl p-6 space-y-3">
        <div className="skeleton h-5 w-28 rounded-full" />
        <div className="skeleton h-20 w-full rounded-xl" />
      </div>
      <div className="skeleton h-11 w-36 rounded-full" />
    </div>
  )
}
