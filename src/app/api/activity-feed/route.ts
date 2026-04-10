// GET  /api/activity-feed?type=all|task_created|...&cursor=ISO_DATE&limit=20
// POST /api/activity-feed { event_type, description, target_id, target_type, metadata }
// Scoped: employees see own events, managers see team events

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { can } from '@/lib/permissions'
import { z } from 'zod'
import type { Role } from '@/types'

const createEventSchema = z.object({
  event_type: z.enum([
    'task_created', 'task_status_changed', 'task_assigned', 'task_reassigned',
    'task_completed', 'task_commented', 'plan_submitted', 'plan_unlocked',
    'checkin_submitted', 'wrapup_submitted', 'field_updated', 'user_joined',
    'warning_acknowledged',
  ]),
  description: z.string().min(1).max(500),
  target_id: z.string().uuid().nullable().optional(),
  target_type: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const role = profile.role as Role
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'all'
  const cursor = searchParams.get('cursor')   // ISO timestamp — load events before this
  const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 50)

  let query = admin
    .from('activity_events')
    .select('id, user_id, event_type, description, target_id, target_type, created_at, user:profiles!activity_events_user_id_fkey(id, name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  // Scope: managers see team, employees see own
  if (!can(role, 'view_team_tasks')) {
    query = query.eq('user_id', user.id)
  } else if (role === 'manager' || role === 'assistant_manager') {
    const teamId = profile.team_id
    if (teamId) {
      query = query.eq('team_id', teamId)
    } else {
      query = query.eq('user_id', user.id)
    }
  } else if (role === 'senior_manager') {
    const { data: teams } = await admin
      .from('teams')
      .select('id')
      .eq('manager_id', user.id)
    const teamIds = (teams ?? []).map((t: { id: string }) => t.id)
    if (profile.team_id) teamIds.push(profile.team_id)
    if (teamIds.length > 0) {
      query = query.in('team_id', teamIds)
    } else {
      query = query.eq('user_id', user.id)
    }
  }
  // admin: no team filter

  if (type !== 'all') {
    query = query.eq('event_type', type)
  }

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data: events, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const formatted = (events ?? []).map(e => {
    const u = Array.isArray(e.user) ? e.user[0] : e.user
    return {
      id: e.id,
      user_id: e.user_id,
      event_type: e.event_type,
      description: e.description,
      target_id: e.target_id,
      target_type: e.target_type,
      created_at: e.created_at,
      user: u ?? null,
    }
  })

  const nextCursor = formatted.length === limit
    ? formatted[formatted.length - 1].created_at
    : null

  return NextResponse.json({ events: formatted, next_cursor: nextCursor })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const result = createEventSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('team_id')
    .eq('id', user.id)
    .single()

  const { data: event, error } = await admin
    .from('activity_events')
    .insert({
      user_id: user.id,
      team_id: profile?.team_id ?? null,
      event_type: result.data.event_type,
      description: result.data.description,
      target_id: result.data.target_id ?? null,
      target_type: result.data.target_type ?? null,
      metadata: result.data.metadata ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(event, { status: 201 })
}
