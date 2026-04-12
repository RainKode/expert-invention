import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getAuthUser, getProfile } from '@/lib/auth-cache'
import TasksClient from './TasksClient'

export default async function TasksPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [profile, { data: projects }] = await Promise.all([
    getProfile(user.id),
    admin.from('projects').select('id, name').order('name'),
  ])

  if (!profile) redirect('/login')

  return (
    <TasksClient
      userId={user.id}
      userRole={profile.role}
      projects={projects ?? []}
    />
  )
}
