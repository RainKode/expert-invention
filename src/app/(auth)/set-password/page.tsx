import { Suspense } from 'react'
import SetPasswordClient from './SetPasswordClient'

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-outline animate-spin">
            progress_activity
          </span>
        </main>
      }
    >
      <SetPasswordClient />
    </Suspense>
  )
}
