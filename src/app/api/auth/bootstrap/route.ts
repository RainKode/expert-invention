import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// GET — check if any admin exists
export async function GET() {
  try {
    const supabase = createAdminClient()
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ hasAdmin: (count ?? 0) > 0 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create the first admin account
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()

    // Guard: if an admin already exists, block this endpoint entirely
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: 'An admin account already exists. This endpoint is disabled.' },
        { status: 403 }
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

    const { name, email, password } = parsed.data

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create profile with admin role
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      name,
      email,
      role: 'admin',
      status: 'active',
      onboarding_complete: true,
      work_week: [1, 2, 3, 4, 5],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      available_hours: 8,
      billable_permission: 'none',
    })

    if (profileError) {
      // Rollback: delete the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Failed to create admin profile' }, { status: 500 })
    }

    // Log to audit trail
    await supabase.from('audit_log').insert({
      actor_id: authData.user.id,
      action: 'user.created',
      resource_type: 'user',
      resource_id: authData.user.id,
      details: { method: 'bootstrap', role: 'admin', name, email },
    })

    return NextResponse.json({
      success: true,
      user: { id: authData.user.id, email, name, role: 'admin' },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
