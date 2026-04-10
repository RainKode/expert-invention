// Redirect root to dashboard (or login if not authenticated — middleware handles that)
import { redirect } from 'next/navigation'

export default function HomePage() {
  redirect('/dashboard')
}
