import { createAdminClient } from '@/lib/supabase/admin'
import type { TimelineEventType } from '@/types'

interface LogEventParams {
  taskId: string
  eventType: TimelineEventType
  actorId: string
  oldValue?: string | null
  newValue?: string | null
  metadata?: Record<string, unknown>
}

/**
 * Append-only timeline event logger.
 * Uses admin client so it always succeeds regardless of RLS context.
 * This is called from within API route handlers that have already
 * authenticated the actor.
 */
export async function logTimelineEvent({
  taskId,
  eventType,
  actorId,
  oldValue = null,
  newValue = null,
  metadata,
}: LogEventParams): Promise<void> {
  const admin = createAdminClient()
  await admin.from('task_timeline').insert({
    task_id: taskId,
    event_type: eventType,
    actor_id: actorId,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
    metadata: metadata ?? null,
  })
}
