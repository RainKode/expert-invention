import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/permissions'
import type { Role } from '@/types'
import AuditTrailClient from './AuditTrailClient'

export default async function AuditTrailPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const check = requirePermission(profile?.role as Role, 'view_audit_trail')
  if (!check.allowed) redirect('/dashboard')

  // Fetch admin/manager users for actor filter
  const { data: actors } = await admin
    .from('profiles')
    .select('id, name')
    .in('role', ['admin', 'senior_manager', 'manager'])
    .eq('status', 'active')
    .order('name')

  return <AuditTrailClient actors={actors ?? []} />
}
