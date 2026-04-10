import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requirePermission } from '@/lib/permissions'
import type { Role } from '@/types'
import SystemSettingsClient from './SystemSettingsClient'

export default async function SystemSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const check = requirePermission(profile?.role as Role, 'manage_users_and_teams')
  if (!check.allowed) redirect('/settings')

  return <SystemSettingsClient />
}
