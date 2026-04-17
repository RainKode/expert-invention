import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: Request) {
  // Rate limit: 5 attempts per minute per IP
  const ip = getClientIP(request)
  const rl = checkRateLimit(`invite:${ip}`, 5, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
    )
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const adminClient = createAdminClient()

  // Validate invite token
  const { data: invite, error: inviteError } = await adminClient
    .from('invite_tokens')
    .select('*, profiles(name, team_id, role)')
    .eq('token', parsed.data.token)
    .eq('accepted', false)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (inviteError || !invite) {
    return NextResponse.json(
      { error: 'This invite link is invalid or has expired. Contact your administrator.' },
      { status: 400 }
    )
  }

  // Set the user's password via admin API
  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    invite.user_id,
    { password: parsed.data.password }
  )

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Mark invite as accepted and update profile
  await adminClient
    .from('invite_tokens')
    .update({ accepted: true })
    .eq('id', invite.id)

  await adminClient
    .from('profiles')
    .update({ invite_accepted: true, status: 'active' })
    .eq('id', invite.user_id)

  // Sign the user in automatically
  const supabase = await createClient()
  const { data: userData } = await adminClient.auth.admin.getUserById(invite.user_id)

  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: userData?.user?.email || '',
    password: parsed.data.password,
  })

  if (signInErr) {
    // Still success but not auto-signed in — they can log in manually
    return NextResponse.json({ success: true, autoSignIn: false })
  }

  return NextResponse.json({ success: true, autoSignIn: true })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: invite } = await adminClient
    .from('invite_tokens')
    .select(`
      id,
      expires_at,
      accepted,
      profiles!inner(name, team_id, role, teams(name))
    `)
    .eq('token', token)
    .single()

  if (!invite || invite.accepted || new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ valid: false })
  }

  const profile = (invite.profiles as unknown) as { name: string; team_id: string; role: string; teams: { name: string } | null }

  return NextResponse.json({
    valid: true,
    name: profile.name,
    teamName: profile.teams?.name || null,
    role: profile.role,
  })
}
