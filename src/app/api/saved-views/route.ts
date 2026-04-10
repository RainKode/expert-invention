import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  filters: z.record(z.string(), z.unknown()).default({}),
  scope: z.enum(['personal', 'shared']).default('personal'),
  team_id: z.string().uuid().nullable().optional(),
  is_default: z.boolean().default(false),
})

// GET /api/saved-views
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('saved_views')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ views: data ?? [] })
}

// POST /api/saved-views — create a saved view
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { name, filters, scope, team_id, is_default } = parsed.data

  // Only manager+ can create shared views
  if (scope === 'shared') {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isManager = ['manager', 'senior_manager', 'admin', 'assistant_manager'].includes(profile?.role ?? '')
    if (!isManager) return NextResponse.json({ error: 'Only managers can create shared views' }, { status: 403 })
  }

  // If setting as default, unset other defaults for this user
  if (is_default) {
    const admin = createAdminClient()
    await admin
      .from('saved_views')
      .update({ is_default: false })
      .eq('created_by', user.id)
      .eq('is_default', true)
  }

  const admin = createAdminClient()
  const { data: view, error } = await admin
    .from('saved_views')
    .insert({
      name,
      filters,
      scope,
      team_id: team_id ?? null,
      created_by: user.id,
      is_default,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ view }, { status: 201 })
}
