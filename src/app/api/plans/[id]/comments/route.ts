// GET  /api/plans/:id/comments — list comments for a plan
// POST /api/plans/:id/comments { text } — add a manager comment

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { can } from '@/lib/permissions'
import { createNotification } from '@/lib/notifications'
import { z } from 'zod'
import type { Role } from '@/types'

const commentSchema = z.object({
  text: z.string().min(1).max(2000),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('plan_comments')
    .select('*, author:profiles(id, name, role)')
    .eq('plan_id', params.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data ?? [] })
}

export async function POST(
  request: NextRequest,
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
  if (!role || !can(role, 'comment_on_plans')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = commentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify plan exists and get the plan owner
  const { data: plan } = await admin
    .from('weekly_plans')
    .select('id, user_id')
    .eq('id', params.id)
    .single()

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const { data, error } = await admin
    .from('plan_comments')
    .insert({ plan_id: params.id, author_id: user.id, text: parsed.data.text })
    .select('*, author:profiles(id, name, role)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the plan owner if the commenter is not the owner
  if (plan.user_id && plan.user_id !== user.id) {
    const { data: authorProfile } = await admin.from('profiles').select('name').eq('id', user.id).single()
    await createNotification({
      recipientId: plan.user_id,
      type: 'comment_on_plan',
      title: 'New Comment on Your Plan',
      message: `${authorProfile?.name ?? 'A manager'} commented on your weekly plan`,
      link: `/plan`,
      metadata: { plan_id: params.id, actor_id: user.id },
    })
  }

  return NextResponse.json({ comment: data }, { status: 201 })
}
