import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Cached auth user — deduplicates getUser() calls across layout + page
 * within the same React render tree. One network request regardless of
 * how many server components call this in the same request.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ?? null
})

/**
 * Cached profile fetch — same deduplication benefit.
 * Fetches full profile so layout + page share the same DB row.
 */
export const getProfile = cache(async (userId: string) => {
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, name, role, status, team_id')
    .eq('id', userId)
    .single()
  return profile ?? null
})
