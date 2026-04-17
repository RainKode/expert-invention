// POST /api/cron/archive-tasks
// Archives completed tasks older than the configurable window (default 6 months).
// Sets status to 'archived'. Files and timeline preserved.
// Should be called by a cron job (Vercel Cron, external scheduler, etc.)
// Protected by CRON_SECRET header.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const DEFAULT_ARCHIVE_MONTHS = 6

export async function POST(request: NextRequest) {
  // Verify cron secret — fail closed when CRON_SECRET is not set
  const secret = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace('Bearer ', '')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Get archive window from system settings (or default)
  let archiveMonths = DEFAULT_ARCHIVE_MONTHS
  const { data: setting } = await admin
    .from('system_settings')
    .select('value')
    .eq('key', 'archive_window_months')
    .single()
  if (setting?.value) {
    const parsed = parseInt(setting.value, 10)
    if (!isNaN(parsed) && parsed > 0) archiveMonths = parsed
  }

  // Calculate cutoff date
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - archiveMonths)
  const cutoffISO = cutoff.toISOString()

  // Archive completed tasks older than cutoff
  const { data: archived, error } = await admin
    .from('tasks')
    .update({ status: 'archived' })
    .eq('status', 'done')
    .not('completed_at', 'is', null)
    .lt('completed_at', cutoffISO)
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const count = archived?.length ?? 0

  // Log the archiving event
  if (count > 0) {
    await admin.from('activity_events').insert({
      user_id: null,
      event_type: 'tasks_archived',
      description: `Archived ${count} completed task${count !== 1 ? 's' : ''} older than ${archiveMonths} months`,
      target_type: 'system',
      target_id: null,
    })
  }

  return NextResponse.json({
    archived_count: count,
    cutoff_date: cutoffISO,
    archive_window_months: archiveMonths,
  })
}
