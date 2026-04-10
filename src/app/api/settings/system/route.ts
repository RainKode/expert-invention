// GET/PATCH /api/settings/system — system settings (admin only)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/permissions'
import { z } from 'zod'
import type { Role } from '@/types'

const patchSchema = z.object({
  company_name: z.string().min(1).max(255).optional(),
  default_available_hours: z.number().min(1).max(168).optional(),
  archive_window_months: z.number().min(1).max(120).optional(),
})

async function getSettings(admin: ReturnType<typeof createAdminClient>) {
  const keys = ['company_name', 'default_available_hours', 'archive_window_months']
  const { data } = await admin
    .from('system_settings')
    .select('key, value')
    .in('key', keys)

  const settingsMap: Record<string, string> = {}
  for (const row of data ?? []) {
    settingsMap[row.key] = row.value
  }

  return {
    company_name: settingsMap.company_name ?? 'Sunday Technologies Inc.',
    default_available_hours: Number(settingsMap.default_available_hours ?? '40'),
    archive_window_months: Number(settingsMap.archive_window_months ?? '6'),
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const check = requirePermission(profile?.role as Role, 'manage_users_and_teams')
  if (!check.allowed) return NextResponse.json({ error: check.error }, { status: check.status })

  const admin = createAdminClient()
  const settings = await getSettings(admin)
  return NextResponse.json({ settings })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const check = requirePermission(profile?.role as Role, 'manage_users_and_teams')
  if (!check.allowed) return NextResponse.json({ error: check.error }, { status: check.status })

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const admin = createAdminClient()

  // Upsert each provided setting
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value === undefined) continue
    await admin
      .from('system_settings')
      .upsert({ key, value: String(value) }, { onConflict: 'key' })
  }

  // Audit log
  await admin.from('audit_log').insert({
    actor_id: user.id,
    action: 'settings.update',
    resource_type: 'system_settings',
    resource_id: null,
    new_value: parsed.data,
  })

  const settings = await getSettings(admin)
  return NextResponse.json({ settings })
}
