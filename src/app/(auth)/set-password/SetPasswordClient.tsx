'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

type FormData = z.infer<typeof schema>

interface InviteInfo {
  name: string
  teamName: string | null
  role: string
}

export default function SetPasswordClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const password = watch('password', '')
  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : password.length < 16 ? 3 : 4

  useEffect(() => {
    if (!token) {
      setTokenError('No invite token found. Please use the link from your invitation email.')
      setLoading(false)
      return
    }

    fetch(`/api/auth/accept-invite?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.valid) {
          setTokenError(
            'This invite link is invalid or has expired. Please contact your administrator.'
          )
        } else {
          setInviteInfo({ name: data.name, teamName: data.teamName, role: data.role })
        }
      })
      .catch(() => setTokenError('Failed to verify invite. Please try again.'))
      .finally(() => setLoading(false))
  }, [token])

  async function onSubmit(data: FormData) {
    setServerError(null)
    const res = await fetch('/api/auth/accept-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: data.password }),
    })
    const json = await res.json()

    if (!res.ok) {
      setServerError(json.error || 'Something went wrong. Please try again.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-outline animate-spin">
          progress_activity
        </span>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 overflow-x-hidden">
      {/* Branding */}
      <div className="fixed top-12 left-0 w-full flex justify-center pointer-events-none">
        <div className="flex items-center gap-2 opacity-80">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
          >
            <span className="material-symbols-outlined text-white text-sm">blur_on</span>
          </div>
          <span className="text-xl font-bold tracking-tighter text-primary">Sunday</span>
        </div>
      </div>

      <div className="w-full max-w-xl">
        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-8 md:p-16 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-surface-container-low rounded-full opacity-40 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-tertiary-fixed-dim rounded-full opacity-20 blur-3xl" />

          <div className="relative z-10">
            {tokenError ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-3xl text-on-error-container">
                    lock_clock
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-on-surface mb-3">Invite link expired</h1>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                  {tokenError}
                </p>
                <Link href="/login" className="text-primary font-semibold hover:opacity-70 transition-opacity text-sm">
                  ← Go to sign in
                </Link>
              </div>
            ) : (
              <>
                <header className="mb-12">
                  <h1 className="text-[2.5rem] leading-[1.1] font-extrabold tracking-tight text-on-surface mb-4">
                    Welcome to Sunday,{' '}
                    {inviteInfo?.name.split(' ')[0]}
                  </h1>
                  <p className="text-on-surface-variant text-lg leading-relaxed max-w-md">
                    {inviteInfo?.teamName ? (
                      <>
                        You've been added to the{' '}
                        <span className="font-semibold text-primary">{inviteInfo.teamName}</span>.{' '}
                      </>
                    ) : null}
                    Secure your account to get started.
                  </p>
                </header>

                {serverError && (
                  <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container text-sm">
                    {serverError}
                  </div>
                )}

                <form className="space-y-8" onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className="space-y-6">
                    {/* Password */}
                    <div className="space-y-2">
                      <label
                        htmlFor="password"
                        className="block px-6 text-sm font-semibold text-on-surface-variant tracking-wide"
                      >
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPw ? 'text' : 'password'}
                          placeholder="••••••••"
                          {...register('password')}
                          className="w-full bg-surface-container-low border-none rounded-full h-14 px-8 focus:ring-2 focus:ring-primary-container focus:outline-none text-on-surface placeholder:text-outline/50 transition-all pr-16"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(!showPw)}
                          className="absolute right-6 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined">
                            {showPw ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-xs text-error ml-6">{errors.password.message}</p>
                      )}
                    </div>

                    {/* Strength */}
                    {password.length > 0 && (
                      <div className="px-2 space-y-2">
                        <div className="flex gap-2 h-1.5 w-full">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`flex-1 rounded-full h-full transition-colors ${
                                strength >= level
                                  ? level <= 1
                                    ? 'bg-error'
                                    : level <= 2
                                    ? 'bg-tertiary-fixed-dim'
                                    : level <= 3
                                    ? 'bg-secondary'
                                    : 'bg-primary'
                                  : 'bg-surface-variant'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                            Strength: {strength <= 1 ? 'Weak' : strength <= 2 ? 'Fair' : strength <= 3 ? 'Good' : 'Strong'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Confirm */}
                    <div className="space-y-2">
                      <label
                        htmlFor="confirm"
                        className="block px-6 text-sm font-semibold text-on-surface-variant tracking-wide"
                      >
                        Confirm Password
                      </label>
                      <input
                        id="confirm"
                        type="password"
                        placeholder="••••••••"
                        {...register('confirm')}
                        className="w-full bg-surface-container-low border-none rounded-full h-14 px-8 focus:ring-2 focus:ring-primary-container focus:outline-none text-on-surface placeholder:text-outline/50 transition-all"
                      />
                      {errors.confirm && (
                        <p className="text-xs text-error ml-6">{errors.confirm.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-14 rounded-full text-white font-bold tracking-tight shadow-ambient hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:scale-100"
                      style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="material-symbols-outlined animate-spin">
                            progress_activity
                          </span>
                          Setting up account…
                        </>
                      ) : (
                        <>
                          Set password & sign in
                          <span className="material-symbols-outlined">arrow_forward</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <footer className="mt-12 pt-8 flex flex-col items-center border-t border-surface-container-high">
                  <p className="text-sm text-outline font-medium">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4">
                      Sign in
                    </Link>
                  </p>
                </footer>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer links */}
      <div className="fixed bottom-12 left-0 w-full flex justify-center gap-8 px-6">
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-outline">
          Sunday — The Digital Atrium
        </span>
      </div>
    </main>
  )
}
