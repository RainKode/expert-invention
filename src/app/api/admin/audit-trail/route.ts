// GET /api/admin/audit-trail — admin-only audit trail with filters + pagination
// Uses audit_log table (admin actions) + activity_events table (system events)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/permissions'
import type { Role } from '@/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const check = requirePermission(profile?.role as Role, 'view_audit_trail')
  if (!check.allowed) return NextResponse.json({ error: check.error }, { status: check.status })

  const admin = createAdminClient()
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')
  const eventType = searchParams.get('event_type')
  const actorId = searchParams.get('actor_id')

  const offset = (page - 1) * limit

  let query = admin
    .from('audit_log')
    .select(
      'id, actor_id, action, resource_type, resource_id, old_value, new_value, created_at, actor:profiles!audit_log_actor_id_fkey(id, name, role)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (dateFrom) query = query.gte('created_at', dateFrom + 'T00:00:00Z')
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59Z')
  if (eventType) query = query.eq('action', eventType)
  if (actorId) query = query.eq('actor_id', actorId)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch distinct event types for filter dropdown
  const { data: eventTypes } = await admin
    .from('audit_log')
    .select('action')

  const uniqueTypes = [...new Set((eventTypes ?? []).map((e: { action: string }) => e.action))]

  const entries = (data ?? []).map((row: {
    id: string
    actor_id: string
    action: string
    resource_type: string | null
    resource_id: string | null
    old_value: unknown
    new_value: unknown
    created_at: string
    actor: { id: string; name: string; role: string } | { id: string; name: string; role: string }[] | null
  }) => {
    const actor = Array.isArray(row.actor) ? row.actor[0] : row.actor
    return {
      id: row.id,
      timestamp: row.created_at,
      actor_id: row.actor_id,
      actor_name: actor?.name ?? 'System',
      actor_role: actor?.role ?? 'system',
      event_type: row.action,
      resource_type: row.resource_type,
      resource_id: row.resource_id,
      old_value: row.old_value,
      new_value: row.new_value,
    }
  })

  return NextResponse.json({
    entries,
    total: count ?? 0,
    page,
    limit,
    total_pages: Math.ceil((count ?? 0) / limit),
    event_types: uniqueTypes,
  })
}
