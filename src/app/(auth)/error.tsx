'use client'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 bg-surface">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
        <span className="material-symbols-outlined text-red-500 text-3xl"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'opsz' 24" }}>
          error
        </span>
      </div>
      <h2 className="text-xl font-semibold text-on-surface">Something went wrong</h2>
      <p className="text-on-surface-variant text-sm text-center max-w-md">
        An authentication error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-2 px-6 py-2.5 bg-primary text-on-primary rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
