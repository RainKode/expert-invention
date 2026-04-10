import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BoardClient from './BoardClient'

export default async function BoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const [{ data: projects }, { data: teamMembers }, { data: savedViews }] = await Promise.all([
    supabase.from('projects').select('id, name').order('name'),
    supabase.from('profiles').select('id, name').eq('team_id', profile.team_id),
    supabase.from('saved_views').select('*').order('created_at'),
  ])

  return (
    <BoardClient
      userId={user.id}
      userRole={profile.role}
      teamId={profile.team_id}
      projects={projects ?? []}
      teamMembers={teamMembers ?? []}
      initialSavedViews={savedViews ?? []}
    />
  )
}
