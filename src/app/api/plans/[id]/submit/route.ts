// POST /api/plans/:id/submit — lock the plan and set submitted_at

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Verify ownership
  const { data: plan } = await admin
    .from('weekly_plans')
    .select('id, user_id, locked')
    .eq('id', id)
    .single()

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (plan.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (plan.locked) return NextResponse.json({ error: 'Already submitted' }, { status: 409 })

  const { data, error } = await admin
    .from('weekly_plans')
    .update({
      submission_status: 'submitted',
      submitted_at: new Date().toISOString(),
      locked: true,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plan: data })
}
