import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUser, getProfile } from '@/lib/auth-cache'
import BoardClient from './BoardClient'

export default async function BoardPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [profile, { data: projects }, { data: savedViews }, { data: customFields }] = await Promise.all([
    getProfile(user.id),
    admin.from('projects').select('id, name').order('name'),
    admin.from('saved_views').select('*').order('created_at'),
    admin.from('custom_field_definitions').select('id, name, field_type, options, scope_type, scope_id, status').eq('status', 'active').order('name'),
  ])

  if (!profile) redirect('/login')

  const { data: teamMembers } = await admin.from('profiles').select('id, name').eq('team_id', profile.team_id)

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
