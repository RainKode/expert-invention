import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import TasksClient from './TasksClient'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('id, name, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: projects } = await admin
    .from('projects')
    .select('id, name')
    .order('name')

  return (
    <TasksClient
      userId={user.id}
      userRole={profile.role}
      projects={projects ?? []}
    />
  )
}
