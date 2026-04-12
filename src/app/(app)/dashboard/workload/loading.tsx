export default function WorkloadLoading() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-7 w-32 rounded-full" />
      <div className="bg-surface-container rounded-2xl p-6 space-y-4">
        <div className="skeleton h-5 w-36 rounded-full" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="skeleton h-8 w-8 rounded-full flex-shrink-0" />
            <div className="skeleton h-4 w-28 rounded-full flex-shrink-0" />
            <div className="flex-1 bg-surface-container-high rounded-full h-3 overflow-hidden">
              <div
                className="skeleton h-full rounded-full"
                style={{ width: `${20 + i * 15}%` }}
              />
            </div>
            <div className="skeleton h-4 w-12 rounded-full flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
