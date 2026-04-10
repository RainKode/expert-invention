import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  // Check profile status — deactivated accounts cannot log in
  const { data: profile } = await supabase
    .from('profiles')
    .select('status, role, name')
    .eq('id', data.user.id)
    .single()

  if (profile?.status === 'deactivated') {
    await supabase.auth.signOut()
    return NextResponse.json(
      { error: 'This account has been deactivated. Contact your administrator.' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      name: profile?.name,
      role: profile?.role,
    },
  })
}
