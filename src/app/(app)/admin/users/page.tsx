import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UsersClient from './UsersClient'

export const metadata = { title: 'Users — Sunday Admin' }

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch teams and departments for the form dropdowns
  const { data: teams } = await supabase.from('teams').select('id, name, department_id, departments(name)').order('name')
  const { data: managers } = await supabase
    .from('profiles')
    .select('id, name')
    .in('role', ['manager', 'senior_manager', 'admin'])
    .eq('status', 'active')
    .order('name')

  return <UsersClient teams={teams ?? []} managers={managers ?? []} />
}
