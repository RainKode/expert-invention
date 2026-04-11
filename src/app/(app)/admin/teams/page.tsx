import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import TeamsClient from './TeamsClient'

export const metadata = { title: 'Teams & Departments — Sunday Admin' }

export default async function AdminTeamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch managers for dropdowns
  const { data: managers } = await admin
    .from('profiles')
    .select('id, name, role')
    .in('role', ['manager', 'senior_manager', 'admin'])
    .eq('status', 'active')
    .order('name')

  return <TeamsClient managers={managers ?? []} />
}
