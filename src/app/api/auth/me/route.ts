import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role, team_id, status')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: profile?.name,
    role: profile?.role,
    team_id: profile?.team_id,
    status: profile?.status,
  })
}
