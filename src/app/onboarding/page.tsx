import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import OnboardingClient from './OnboardingClient'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('name, role, team_id, onboarding_complete')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  // Already completed or admin — go to dashboard
  if (profile.onboarding_complete || profile.role === 'admin') {
    redirect('/dashboard')
  }

  // Get team + manager
  let teamName: string | null = null
  let managerName: string | null = null
  if (profile.team_id) {
    const { data: team } = await admin
      .from('teams')
      .select('name, manager:profiles!teams_manager_id_fkey(name)')
      .eq('id', profile.team_id)
      .single()
    if (team) {
      teamName = team.name
      const mgr = Array.isArray(team.manager) ? team.manager[0] : team.manager
      managerName = mgr?.name ?? null
    }
  }

  // Get pending tasks
  const { data: tasks } = await admin
    .from('tasks')
    .select('id, title, priority, due_date, status')
    .eq('assignee_id', user.id)
    .neq('status', 'done')
    .order('due_date', { ascending: true })
    .limit(10)

  return (
    <OnboardingClient
      employeeName={profile.name}
      teamName={teamName}
      managerName={managerName}
      pendingTasks={(tasks ?? []).map((t: { id: string; title: string; priority: string; due_date: string | null; status: string }) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        due_date: t.due_date,
        status: t.status,
      }))}
    />
  )
}
