import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import BoardClient from './BoardClient'

export default async function BoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const [{ data: projects }, { data: teamMembers }, { data: savedViews }, { data: customFields }] = await Promise.all([
    admin.from('projects').select('id, name').order('name'),
    admin.from('profiles').select('id, name').eq('team_id', profile.team_id),
    admin.from('saved_views').select('*').order('created_at'),
    admin.from('custom_field_definitions').select('id, name, field_type, options, scope_type, scope_id, status').eq('status', 'active').order('name'),
  ])

  return (
    <BoardClient
      userId={user.id}
      userRole={profile.role}
      teamId={profile.team_id}
      projects={projects ?? []}
      teamMembers={teamMembers ?? []}
      initialSavedViews={savedViews ?? []}
      customFields={customFields ?? []}
    />
  )
}
