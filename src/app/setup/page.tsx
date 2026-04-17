'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

type FormData = z.infer<typeof schema>

export default function BootstrapPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [hasAdmin, setHasAdmin] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPw, setShowPw] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const password = watch('password', '')
  const strength =
    password.length === 0
      ? 0
      : password.length < 8
      ? 1
      : password.length < 12
      ? 2
      : password.length < 16
      ? 3
      : 4

  // Check if admin already exists — if yes, redirect to login
  useEffect(() => {
    fetch('/api/auth/bootstrap')
      .then((r) => r.json())
      .then((data) => {
        if (data.hasAdmin) {
          setHasAdmin(true)
          router.replace('/login')
        }
      })
      .catch(() => {
        // If we can't check, allow form to show — the POST will guard
      })
      .finally(() => setChecking(false))
  }, [router])

  async function onSubmit(data: FormData) {
    setServerError(null)
    const res = await fetch('/api/auth/bootstrap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
      }),
    })
    const json = await res.json()

    if (!res.ok) {
      setServerError(json.error || 'Something went wrong. Please try again.')
      return
    }

    router.push('/login')
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-surface">
        <span className="material-symbols-outlined text-4xl text-outline animate-spin">
          progress_activity
        </span>
      </main>
    )
  }

  if (hasAdmin) {
    return null // Redirecting...
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Background decorative blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] blur-[120px] rounded-full bg-primary-fixed/30" />
        <div className="absolute -bottom-[10%] -left-[5%] w-[40%] h-[40%] blur-[120px] rounded-full bg-tertiary-fixed/20" />
      </div>

      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-[480px] flex flex-col gap-8">
          <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-8 md:p-12">
            {/* Logo & Heading */}
            <div className="text-center mb-10">
              <div className="flex justify-center mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-ambient"
                  style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
                >
                  <span className="material-symbols-outlined text-white text-2xl">hub</span>
                </div>
              </div>
              <h2 className="text-xl font-bold tracking-tighter text-on-surface mb-6">Sunday</h2>
              <h1 className="text-on-surface text-2xl font-bold tracking-tight mb-2">
                Create First Admin
              </h1>
              <p className="text-on-surface-variant text-sm">
                Set up the first administrator account to get started with Sunday.
              </p>
            </div>

            {/* Info Banner */}
            <div className="mb-8 p-4 rounded-xl bg-primary-container/30 border border-primary-container">
              <div className="flex gap-3 items-start">
                <span className="material-symbols-outlined text-primary text-xl mt-0.5">info</span>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  This screen only appears once. After creating the admin account, all other users
                  are created through the admin panel.
                </p>
              </div>
            </div>

            {/* Error banner */}
            {serverError && (
              <div className="mb-6 overflow-hidden rounded-xl bg-surface-container-low flex items-stretch border-l-4 border-tertiary-fixed-dim">
                <div className="p-4 flex gap-3 items-center">
                  <span className="material-symbols-outlined text-error text-xl">error</span>
                  <p className="text-sm text-on-surface-variant font-medium">{serverError}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="text-xs font-semibold text-on-surface-variant px-1 uppercase tracking-widest block"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Ahmed Khan"
                  {...register('name')}
                  className="w-full bg-surface-container-low border-none rounded-full px-5 py-3.5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container focus:outline-none transition-all"
                />
                {errors.name && (
                  <p className="text-xs text-error px-1">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold text-on-surface-variant px-1 uppercase tracking-widest block"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@company.com"
                  {...register('email')}
                  className="w-full bg-surface-container-low border-none rounded-full px-5 py-3.5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container focus:outline-none transition-all"
                />
                {errors.email && (
                  <p className="text-xs text-error px-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-on-surface-variant px-1 uppercase tracking-widest block"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    {...register('password')}
                    className="w-full bg-surface-container-low border-none rounded-full px-5 py-3.5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container focus:outline-none transition-all pr-14"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPw ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {/* Strength indicator — 4 segments */}
                {password.length > 0 && (
                  <div className="flex gap-1.5 px-4 pt-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          strength >= level
                            ? level === 1
                              ? 'bg-error'
                              : level === 2
                              ? 'bg-tertiary-fixed-dim'
                              : level === 3
                              ? 'bg-tertiary'
                              : 'bg-primary'
                            : 'bg-surface-container-high'
                        }`}
                      />
                    ))}
                  </div>
                )}
                {errors.password && (
                  <p className="text-xs text-error px-1">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirm"
                  className="text-xs font-semibold text-on-surface-variant px-1 uppercase tracking-widest block"
                >
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  type="password"
                  placeholder="Repeat password"
                  {...register('confirm')}
                  className="w-full bg-surface-container-low border-none rounded-full px-5 py-3.5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container focus:outline-none transition-all"
                />
                {errors.confirm && (
                  <p className="text-xs text-error px-1">{errors.confirm.message}</p>
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
                      Creating admin…
                    </>
                  ) : (
                    <>
                      Create Admin Account
                      <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </>
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
    </div>
  )
}
