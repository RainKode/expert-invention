import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  field_type: z.enum(['text', 'number', 'date', 'dropdown', 'checkbox']),
  options: z.array(z.string().min(1).max(100)).max(50).optional(),
  scope_type: z.enum(['team', 'project', 'global']).default('team'),
  scope_id: z.string().uuid().nullable().optional(),
})

// GET /api/custom-fields?scope_type=team&scope_id=xxx&include_archived=true
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const scopeType = searchParams.get('scope_type')
  const scopeId = searchParams.get('scope_id')
  const includeArchived = searchParams.get('include_archived') === 'true'

  let query = supabase
    .from('custom_field_definitions')
    .select('*')
    .order('created_at', { ascending: true })

  if (!includeArchived) {
    query = query.eq('status', 'active')
  }

  if (scopeType) {
    query = query.eq('scope_type', scopeType)
  }
  if (scopeId) {
    query = query.eq('scope_id', scopeId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ fields: data ?? [] })
}

// POST /api/custom-fields — create new field (manager+ only)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isManager = ['manager', 'senior_manager', 'admin', 'assistant_manager'].includes(profile?.role ?? '')
  if (!isManager) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { name, field_type, options, scope_type, scope_id } = parsed.data

  if (field_type === 'dropdown' && (!options || options.length === 0)) {
    return NextResponse.json({ error: 'Dropdown fields require at least one option' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: field, error } = await admin
    .from('custom_field_definitions')
    .insert({
      name,
      field_type,
      options: options ? options : null,
      scope_type,
      scope_id: scope_id ?? null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ field }, { status: 201 })
}
