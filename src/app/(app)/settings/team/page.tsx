import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeamSettingsClient from './TeamSettingsClient'

export default async function TeamSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <TeamSettingsClient />
}
