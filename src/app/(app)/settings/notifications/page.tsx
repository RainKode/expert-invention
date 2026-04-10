import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotificationPreferencesClient from './NotificationPreferencesClient'

export default async function NotificationPreferencesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <NotificationPreferencesClient />
}
