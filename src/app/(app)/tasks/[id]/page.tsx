import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import TaskDetailClient from './TaskDetailClient'

type Params = { params: Promise<{ id: string }> }

export default async function TaskDetailPage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('id, name, role, team_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Fetch team members for reassign if manager
  const isManager = ['manager', 'senior_manager', 'admin', 'assistant_manager'].includes(profile.role)
  let teamMembers: { id: string; name: string; email: string }[] = []
  if (isManager && profile.team_id) {
    const { data } = await admin
      .from('profiles')
      .select('id, name, email')
      .eq('team_id', profile.team_id)
      .eq('status', 'active')
      .neq('id', user.id)
    teamMembers = data ?? []
  }

  // Fetch projects for dependency modal tasks list
  const { data: allTasks } = await admin
    .from('tasks')
    .select('id, title, status')
    .neq('id', id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <TaskDetailClient
      taskId={id}
      userId={user.id}
      userRole={profile.role}
      teamMembers={teamMembers}
      availableTasksForDeps={allTasks ?? []}
    />
  )
}
