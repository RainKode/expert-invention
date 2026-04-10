// POST /api/plans/:id/unlock — manager unlocks a submitted plan

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { can } from '@/lib/permissions'
import type { Role } from '@/types'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role as Role | undefined
  if (!role || !can(role, 'unlock_plan')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const admin = createAdminClient()

  const { data: plan } = await admin
    .from('weekly_plans')
    .select('id, locked')
    .eq('id', params.id)
    .single()

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (!plan.locked) return NextResponse.json({ error: 'Plan is not locked' }, { status: 409 })

  const { data, error } = await admin
    .from('weekly_plans')
    .update({ submission_status: 'draft', locked: false, submitted_at: null })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plan: data })
}
