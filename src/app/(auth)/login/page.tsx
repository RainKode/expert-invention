'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const json = await res.json()

    if (!res.ok) {
      setServerError(json.error || 'Something went wrong. Please try again.')
      return
    }

    // Redirect based on role
    const role = json.user?.role
    if (role === 'admin') {
      router.push('/admin/users')
    } else {
      router.push('/dashboard')
    }
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-[440px] flex flex-col gap-8">
        {/* Card */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-8 md:p-12">
          {/* Logo & Heading */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <span className="text-2xl font-extrabold tracking-tighter text-primary">Sunday</span>
            </div>
            <h1 className="text-on-surface text-2xl font-bold tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-on-surface-variant text-sm">Sign in to your account</p>
          </div>

          {/* Error banner */}
          {serverError && (
            <div className="mb-8 overflow-hidden rounded-xl bg-surface-container-low flex items-stretch border-l-4 border-tertiary-fixed-dim">
              <div className="p-4 flex gap-3 items-center">
                <span className="material-symbols-outlined text-error text-xl">error</span>
                <p className="text-sm text-on-surface-variant font-medium">{serverError}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold text-on-surface-variant px-1 uppercase tracking-widest block"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                {...register('email')}
                className="w-full bg-surface-container-low border-none rounded-full px-5 py-3.5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container focus:outline-none transition-all"
              />
              {errors.email && (
                <p className="text-xs text-error px-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-primary hover:opacity-70 transition-opacity"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full bg-surface-container-low border-none rounded-full px-5 py-3.5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-error px-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-white font-semibold py-4 rounded-full shadow-ambient hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-xl animate-spin">
                      progress_activity
                    </span>
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Tagline */}
        <div className="flex justify-center gap-6 items-center opacity-40">
          <div className="h-px bg-outline-variant w-12" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant">
            The Digital Atrium
          </span>
          <div className="h-px bg-outline-variant w-12" />
        </div>
      </div>
    </main>
  )
}
