import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logTimelineEvent } from '@/lib/task-timeline'
import { z } from 'zod'

const setSchema = z.object({
  field_definition_id: z.string().uuid(),
  value: z.string().max(2000).nullable(),
})

type Params = { params: Promise<{ id: string }> }

// GET /api/tasks/:id/custom-field-values
export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('custom_field_values')
    .select('*, field_definition:custom_field_definitions(*)')
    .eq('task_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ values: data ?? [] })
}

// POST /api/tasks/:id/custom-field-values — set or update a value (upsert)
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = setSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { field_definition_id, value } = parsed.data

  // Verify field exists and is active
  const { data: fieldDef } = await supabase
    .from('custom_field_definitions')
    .select('*')
    .eq('id', field_definition_id)
    .single()

  if (!fieldDef) return NextResponse.json({ error: 'Custom field not found' }, { status: 404 })
  if (fieldDef.status === 'archived') return NextResponse.json({ error: 'Cannot set value on archived field' }, { status: 422 })

  // Type validation
  if (value !== null) {
    if (fieldDef.field_type === 'number' && isNaN(Number(value))) {
      return NextResponse.json({ error: 'Value must be a number for this field' }, { status: 400 })
    }
    if (fieldDef.field_type === 'checkbox' && !['true', 'false'].includes(value)) {
      return NextResponse.json({ error: 'Checkbox value must be true or false' }, { status: 400 })
    }
    if (fieldDef.field_type === 'dropdown' && fieldDef.options && !fieldDef.options.includes(value)) {
      return NextResponse.json({ error: `Value must be one of: ${fieldDef.options.join(', ')}` }, { status: 400 })
    }
  }

  // Get existing value for timeline diff
  const { data: existing } = await supabase
    .from('custom_field_values')
    .select('value')
    .eq('task_id', id)
    .eq('field_definition_id', field_definition_id)
    .single()

  const admin = createAdminClient()
  const { data: result, error } = await admin
    .from('custom_field_values')
    .upsert({
      task_id: id,
      field_definition_id,
      value,
      set_by: user.id,
    }, { onConflict: 'task_id,field_definition_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logTimelineEvent({
    taskId: id,
    eventType: 'field_updated',
    actorId: user.id,
    oldValue: existing?.value ?? '',
    newValue: value ?? '',
    metadata: { field: fieldDef.name, field_definition_id },
  })

  return NextResponse.json({ value: result })
}
