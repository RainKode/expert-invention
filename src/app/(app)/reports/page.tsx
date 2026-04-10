import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { can } from '@/lib/permissions'
import type { Role } from '@/types'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('name, role, team_id')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const role = profile.role as Role
  if (!can(role, 'export_reports')) redirect('/dashboard')

  // Fetch teams and employees for selectors
  const [teamsRes, employeesRes] = await Promise.all([
    admin.from('teams').select('id, name').order('name'),
    admin.from('profiles').select('id, name').eq('status', 'active').order('name'),
  ])

  return (
    <ReportsClient
      userId={user.id}
      userName={profile.name}
      userRole={role}
      isAdmin={role === 'admin'}
      teams={(teamsRes.data ?? []).map((t: { id: string; name: string }) => ({ id: t.id, name: t.name }))}
      employees={(employeesRes.data ?? []).map((e: { id: string; name: string }) => ({ id: e.id, name: e.name }))}
    />
  )
}
