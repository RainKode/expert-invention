// src/app/(app)/dashboard/activity/page.tsx
// Activity Feed — team-scoped timeline of all events
// Server component: loads first page of events and passes to ActivityClient

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { can } from '@/lib/permissions'
import ActivityClient from './ActivityClient'
import type { Role, ActivityEvent } from '@/types'

export default async function ActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const role = profile.role as Role

  // ── Scope query ────────────────────────────────────────────────────────────
  let eventsQuery = admin
    .from('activity_events')
    .select(`
      id, user_id, team_id, event_type, description, target_id, target_type, metadata, created_at,
      user:profiles!activity_events_user_id_fkey(id, name)
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  if (role === 'employee') {
    eventsQuery = eventsQuery.eq('user_id', user.id)
  } else if (role === 'assistant_manager' || role === 'manager') {
    if (profile.team_id) {
      eventsQuery = eventsQuery.eq('team_id', profile.team_id)
    } else {
      eventsQuery = eventsQuery.eq('user_id', user.id)
    }
  } else if (role === 'senior_manager') {
    const { data: teams } = await admin.from('teams').select('id').eq('manager_id', user.id)
    const teamIds = (teams ?? []).map((t: { id: string }) => t.id)
    if (profile.team_id) teamIds.push(profile.team_id)
    if (teamIds.length > 0) {
      eventsQuery = eventsQuery.in('team_id', teamIds)
    }
  }
  // admin: no filter

  const { data: rawEvents } = await eventsQuery

  const events: ActivityEvent[] = (rawEvents ?? []).map((e: {
    id: string; user_id: string; team_id: string | null; event_type: string;
    description: string; target_id: string | null; target_type: string | null;
    metadata: Record<string, unknown> | null; created_at: string;
    user: { id: string; name: string } | { id: string; name: string }[] | null
  }) => {
    const u = Array.isArray(e.user) ? e.user[0] : e.user
    return {
      id: e.id, user_id: e.user_id, team_id: e.team_id,
      event_type: e.event_type as ActivityEvent['event_type'],
      description: e.description, target_id: e.target_id, target_type: e.target_type,
      metadata: e.metadata, created_at: e.created_at,
      user: u ? { id: u.id, name: u.name } : undefined,
    }
  })

  const nextCursor = events.length === 20 ? events[events.length - 1].created_at : null

  return <ActivityClient initialEvents={events} initialCursor={nextCursor} userRole={role} />
}
