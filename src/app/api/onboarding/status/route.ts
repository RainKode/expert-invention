// GET /api/onboarding/status — checks if user needs onboarding
// Returns { needs_onboarding: boolean, team_name, manager_name, pending_tasks_count }

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('name, role, team_id, onboarding_complete')
    .eq('id', user.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Admin never needs onboarding
  if (profile.role === 'admin' || profile.onboarding_complete) {
    return NextResponse.json({ needs_onboarding: false })
  }

  // Get team + manager info
  let teamName = null
  let managerName = null
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

  // Count pending tasks
  const { count } = await admin
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('assignee_id', user.id)
    .neq('status', 'done')
    .neq('status', 'archived')

  return NextResponse.json({
    needs_onboarding: true,
    employee_name: profile.name,
    team_name: teamName,
    manager_name: managerName,
    pending_tasks_count: count ?? 0,
  })
}

// POST /api/onboarding/status — marks onboarding complete
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  await admin
    .from('profiles')
    .update({ onboarding_complete: true })
    .eq('id', user.id)

  return NextResponse.json({ success: true })
}
