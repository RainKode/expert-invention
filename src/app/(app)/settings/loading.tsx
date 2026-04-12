export default function SettingsLoading() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="skeleton h-7 w-32 rounded-full" />
      <div className="bg-surface-container rounded-2xl p-6 space-y-5">
        <div className="skeleton h-5 w-40 rounded-full" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="skeleton h-4 w-32 rounded-full" />
            <div className="skeleton h-11 w-full rounded-full" />
          </div>
        ))}
      </div>
      <div className="bg-surface-container rounded-2xl p-6 space-y-5">
        <div className="skeleton h-5 w-36 rounded-full" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <div className="skeleton h-4 w-40 rounded-full" />
              <div className="skeleton h-3 w-56 rounded-full" />
            </div>
            <div className="skeleton h-6 w-10 rounded-full" />
          </div>
        ))}
      </div>
      <div className="skeleton h-11 w-28 rounded-full" />
    </div>
  )
}
