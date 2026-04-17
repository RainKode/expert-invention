'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function ResetPasswordPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPw, setShowPw] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const password = watch('password', '')
  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : password.length < 16 ? 3 : 4

  async function onSubmit(data: FormData) {
    setServerError(null)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: data.password }),
    })
    const json = await res.json()

    if (!res.ok) {
      setServerError(json.error || 'Something went wrong. Please try again.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="mb-12 flex flex-col items-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-ambient mb-4"
          style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
        >
          <span className="material-symbols-outlined text-white text-2xl">hub</span>
        </div>
        <h2 className="text-xl font-bold tracking-tighter text-on-surface">Sunday</h2>
      </div>

      <div className="w-full max-w-[440px]">
        <div className="bg-surface-container-lowest p-10 md:p-12 rounded-2xl shadow-ambient">
          <header className="mb-10 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface mb-3">Set new password</h1>
            <p className="text-on-surface-variant text-sm">Choose a strong password for your account.</p>
          </header>

          {serverError && (
            <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container text-sm">
              {serverError}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-4 block">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  {...register('password')}
                  className="w-full bg-surface-container-low border-none rounded-full px-6 py-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container focus:outline-none transition-all pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPw ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {/* Strength indicator */}
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
                <p className="text-xs text-error ml-4">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-4 block">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Repeat password"
                {...register('confirm')}
                className="w-full bg-surface-container-low border-none rounded-full px-6 py-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container focus:outline-none transition-all"
              />
              {errors.confirm && (
                <p className="text-xs text-error ml-4">{errors.confirm.message}</p>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-white font-semibold py-4 rounded-full shadow-ambient hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Saving…
                  </>
                ) : (
                  'Set Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
