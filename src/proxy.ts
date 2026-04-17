import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  // API routes: return JSON 401 instead of HTML redirect
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return await handleApiAuth(request)
  }

  return await updateSession(request)
}

async function handleApiAuth(request: NextRequest) {
  // Allow public API routes (auth endpoints)
  const publicApiPaths = ['/api/auth/login', '/api/auth/forgot-password', '/api/auth/reset-password', '/api/auth/accept-invite', '/api/auth/callback', '/api/auth/bootstrap']
  if (publicApiPaths.some((path) => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // For all other API routes, check auth via Supabase session cookie
  const { createServerClient } = await import('@supabase/ssr')
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - /setup (bootstrap page — no auth required)
     */
    '/((?!_next/static|_next/image|favicon.ico|setup).*)',
  ],
}
