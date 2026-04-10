import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/notifications — paginated list for current user
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const adminClient = createAdminClient()
  const { searchParams } = new URL(request.url)

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const readFilter = searchParams.get('read') // 'true' | 'false' | null (all)

  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = adminClient
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (readFilter === 'true') {
    query = query.eq('read', true)
  } else if (readFilter === 'false') {
    query = query.eq('read', false)
  }

  const { data: notifications, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also return unread count
  const { count: unreadCount } = await adminClient
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('read', false)

  return NextResponse.json({
    notifications: notifications ?? [],
    total: count ?? 0,
    unread_count: unreadCount ?? 0,
    page,
    limit,
  })
}
