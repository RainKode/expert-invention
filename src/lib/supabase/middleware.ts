import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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

  // Refresh session — must not be removed per @supabase/ssr docs
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public paths that do not require authentication
  const publicPaths = [
    '/login',
    '/forgot-password',
    '/reset-password',
    '/set-password',
    '/setup',
  ]

  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Onboarding redirect: non-admin users who haven't completed onboarding
  if (user && !isPublicPath) {
    const isOnboardingPath = request.nextUrl.pathname.startsWith('/onboarding')
    const isApiPath = request.nextUrl.pathname.startsWith('/api')

    if (!isOnboardingPath && !isApiPath) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_complete')
        .eq('id', user.id)
        .single()

      if (profile && profile.role !== 'admin' && !profile.onboarding_complete) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
