// GET  /api/plans?week_start=YYYY-MM-DD  — fetch (or create draft) plan for current user
// POST /api/plans  { week_start_date }   — explicitly create a plan for a given week

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const createPlanSchema = z.object({
  week_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const weekStart = searchParams.get('week_start')
  if (!weekStart) {
    return NextResponse.json({ error: 'week_start query param required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Try to find existing plan
  const { data: plan, error } = await admin
    .from('weekly_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_start_date', weekStart)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If no plan exists, create a draft
  if (!plan) {
    const { data: newPlan, error: insertError } = await admin
      .from('weekly_plans')
      .insert({ user_id: user.id, week_start_date: weekStart, submission_status: 'draft' })
      .select()
      .single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    return NextResponse.json({ plan: newPlan, entries: [], comments: [] })
  }

  // Fetch entries with task info
  const { data: entries } = await admin
    .from('plan_entries')
    .select(`
      *,
      task:tasks(id, title, priority, status, estimated_hours)
    `)
    .eq('plan_id', plan.id)
    .order('day_of_week')

  // Fetch comments with author info
  const { data: comments } = await admin
    .from('plan_comments')
    .select(`
      *,
      author:profiles(id, name, role)
    `)
    .eq('plan_id', plan.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ plan, entries: entries ?? [], comments: comments ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = createPlanSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('weekly_plans')
    .upsert(
      { user_id: user.id, week_start_date: parsed.data.week_start_date, submission_status: 'draft' },
      { onConflict: 'user_id,week_start_date' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plan: data }, { status: 201 })
}
