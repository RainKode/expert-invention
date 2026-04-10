import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AdminSetupClient from './AdminSetupClient'

export default async function AdminSetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  // Fetch current org structure
  const [deptRes, teamRes, employeeRes] = await Promise.all([
    admin.from('departments').select('id, name, head_id, profiles!departments_head_id_fkey(name)').order('name'),
    admin.from('teams').select('id, name, department_id, manager_id, profiles!teams_manager_id_fkey(name)').order('name'),
    admin.from('profiles').select('id, name, role, team_id, status').neq('role', 'admin').order('name'),
  ])

  const departments = (deptRes.data ?? []).map((d: { id: string; name: string; head_id: string | null; profiles: { name: string } | { name: string }[] | null }) => {
    const head = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles
    return { id: d.id, name: d.name, head_id: d.head_id, head_name: head?.name ?? null }
  })

  const teams = (teamRes.data ?? []).map((t: { id: string; name: string; department_id: string | null; manager_id: string | null; profiles: { name: string } | { name: string }[] | null }) => {
    const mgr = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles
    return { id: t.id, name: t.name, department_id: t.department_id, manager_id: t.manager_id, manager_name: mgr?.name ?? null }
  })

  const employees = (employeeRes.data ?? []).map((e: { id: string; name: string; role: string; team_id: string | null; status: string }) => ({
    id: e.id, name: e.name, role: e.role, team_id: e.team_id, status: e.status,
  }))

  return (
    <AdminSetupClient
      departments={departments}
      teams={teams}
      employees={employees}
    />
  )
}
