import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { can } from '@/lib/permissions'
import { type Role } from '@/types'
import TeamTasksClient from './TeamTasksClient'

export default async function TeamTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('id, name, role, team_id')
    .eq('id', user.id)
    .single()

  if (!profile || !can(profile.role as Role, 'view_team_tasks')) {
    redirect('/tasks')
  }

  const { data: projects } = await admin
    .from('projects')
    .select('id, name')
    .order('name')

  // Fetch team members for assignee filter
  const { data: teamMembers } = await admin
    .from('profiles')
    .select('id, name, email')
    .eq('team_id', profile.team_id)
    .eq('status', 'active')
    .order('name')

  return (
    <TeamTasksClient
      userId={user.id}
      userRole={profile.role}
      projects={projects ?? []}
      teamMembers={teamMembers ?? []}
    />
  )
}
