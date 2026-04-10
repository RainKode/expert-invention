// GET/PATCH /api/settings/user-preferences — user's default task view
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const patchSchema = z.object({
  default_task_view: z.enum(['list', 'kanban']).optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('default_task_view')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ default_task_view: profile?.default_task_view ?? 'list' })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const admin = createAdminClient()
  await admin
    .from('profiles')
    .update(parsed.data)
    .eq('id', user.id)

  return NextResponse.json({ success: true })
}
