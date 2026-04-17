import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { OPTIONAL_NOTIFICATION_TYPES, type NotificationType } from '@/types'

// GET /api/notifications/preferences — get user's notification preferences
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const adminClient = createAdminClient()

  const { data: preferences } = await adminClient
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)

  // Build the full preference set — defaults to enabled for types without a row
  const result = OPTIONAL_NOTIFICATION_TYPES.map((type) => {
    const existing = preferences?.find((p: { notification_type: string }) => p.notification_type === type)
    return {
      notification_type: type,
      enabled: existing ? existing.enabled : true,
    }
  })

  return NextResponse.json({ preferences: result })
}

// PUT /api/notifications/preferences — update notification preferences
export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const adminClient = createAdminClient()

  let body: { preferences: { notification_type: string; enabled: boolean }[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.preferences || !Array.isArray(body.preferences)) {
    return NextResponse.json({ error: 'preferences array is required' }, { status: 400 })
  }

  // Only allow updating optional types
  const validUpdates = body.preferences.filter((p) =>
    OPTIONAL_NOTIFICATION_TYPES.includes(p.notification_type as NotificationType)
  )

  // Bulk upsert all preferences atomically
  const rows = validUpdates.map((pref: { notification_type: string; enabled: boolean }) => ({
    user_id: user.id,
    notification_type: pref.notification_type,
    enabled: pref.enabled,
  }))

  if (rows.length > 0) {
    await adminClient
      .from('notification_preferences')
      .upsert(rows, { onConflict: 'user_id,notification_type' })
  }

  return NextResponse.json({ success: true })
}
