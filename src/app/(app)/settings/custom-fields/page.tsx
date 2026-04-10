import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CustomFieldsClient from './CustomFieldsClient'

const MANAGER_ROLES = ['assistant_manager', 'manager', 'senior_manager', 'admin']

export default async function CustomFieldsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single()

  if (!profile || !MANAGER_ROLES.includes(profile.role)) {
    redirect('/dashboard')
  }

  const { data: fields } = await supabase
    .from('custom_field_definitions')
    .select('*')
    .order('created_at', { ascending: false })

  return <CustomFieldsClient initialFields={fields ?? []} teamId={profile.team_id} />
}
