import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  try {
    // Rate limit: 5 attempts per minute per IP
    const ip = getClientIP(request)
    const rl = checkRateLimit(`forgot:${ip}`, 5, 60_000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
      )
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const supabase = await createClient()

    // Always return success regardless of whether email exists (security)
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    return NextResponse.json({
      message: "If this email exists, a reset link has been sent.",
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
