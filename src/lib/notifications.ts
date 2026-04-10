import { createAdminClient } from '@/lib/supabase/admin'
import {
  type NotificationType,
  type NotificationChannel,
  EMAIL_NOTIFICATION_TYPES,
  OPTIONAL_NOTIFICATION_TYPES,
} from '@/types'

interface CreateNotificationParams {
  recipientId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: Record<string, unknown>
}

/**
 * Create a notification for a user.
 * - Checks user's preference for optional types before creating.
 * - Sets channel to 'both' for urgent (email) types, 'in_app' otherwise.
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  const adminClient = createAdminClient()
  const { recipientId, type, title, message, link, metadata } = params

  // Check preference if this is an optional notification type
  if (OPTIONAL_NOTIFICATION_TYPES.includes(type)) {
    const { data: pref } = await adminClient
      .from('notification_preferences')
      .select('enabled')
      .eq('user_id', recipientId)
      .eq('notification_type', type)
      .single()

    // If user has explicitly disabled this type, skip creating it
    if (pref && !pref.enabled) {
      return
    }
  }

  const channel: NotificationChannel = EMAIL_NOTIFICATION_TYPES.includes(type)
    ? 'both'
    : 'in_app'

  await adminClient.from('notifications').insert({
    recipient_id: recipientId,
    type,
    title,
    message,
    link: link ?? null,
    channel,
    metadata: metadata ?? null,
  })
}

/**
 * Create the same notification for multiple recipients.
 */
export async function createNotificationBulk(
  recipientIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await Promise.all(
    recipientIds.map((recipientId) =>
      createNotification({ recipientId, type, title, message, link, metadata })
    )
  )
}

/**
 * Get the unread notification count for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const adminClient = createAdminClient()
  const { count } = await adminClient
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('read', false)

  return count ?? 0
}
