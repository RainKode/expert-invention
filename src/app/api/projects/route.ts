import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  team_id: z.string().uuid().optional().nullable(),
})

// GET /api/projects — list all projects accessible to the current user
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('team_id')

  let query = supabase.from('projects').select('id, name, team_id, created_by, created_at').order('name')
  if (teamId) query = query.or(`team_id.eq.${teamId},team_id.is.null`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ projects: data })
}

// POST /api/projects — create project (manager+ or admin)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const allowedRoles = ['manager', 'senior_manager', 'admin', 'assistant_manager']
  if (!profile || !allowedRoles.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden: Manager+ required' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('projects').insert({
    ...parsed.data,
    created_by: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ project: data }, { status: 201 })
}
