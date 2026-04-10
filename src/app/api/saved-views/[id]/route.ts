import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  is_default: z.boolean().optional(),
  scope: z.enum(['personal', 'shared']).optional(),
})

type Params = { params: Promise<{ id: string }> }

// PATCH /api/saved-views/:id
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  // Only creator can edit
  const { data: existing } = await supabase
    .from('saved_views')
    .select('created_by')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'View not found' }, { status: 404 })
  if (existing.created_by !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (parsed.data.is_default) {
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
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ view })
}

// DELETE /api/saved-views/:id
export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase
    .from('saved_views')
    .select('created_by')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'View not found' }, { status: 404 })
  if (existing.created_by !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  await admin.from('saved_views').delete().eq('id', id)

  return NextResponse.json({ message: 'Deleted' })
}
