'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    // Always show success for security (never reveal if email exists)
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Logo */}
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
        <div className="bg-surface-container-lowest p-10 md:p-12 rounded-2xl shadow-ambient relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

          {!submitted ? (
            <>
              <header className="mb-10 text-center">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface mb-3">
                  Reset your password
                </h1>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Enter your work email and we'll send you a link to reset your password.
                </p>
              </header>

              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant ml-4 block"
                  >
                    Work Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    {...register('email')}
                    className="w-full bg-surface-container-low border-none rounded-full px-6 py-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container focus:outline-none transition-all"
                  />
                  {errors.email && (
                    <p className="text-xs text-error ml-4">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-white font-semibold py-4 rounded-full shadow-ambient hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined text-xl animate-spin">
                        progress_activity
                      </span>
                      Sending…
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-sm text-on-surface-variant hover:text-on-surface transition-colors font-medium"
                  >
                    ← Back to sign in
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-6">
                <span
                  className="material-symbols-outlined text-4xl text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  mark_email_read
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-on-surface mb-3">
                Check your inbox
              </h1>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
                If this email exists in our system, a reset link has been sent. Check your inbox
                and follow the instructions.
              </p>
              <Link
                href="/login"
                className="text-sm font-semibold text-primary hover:opacity-70 transition-opacity"
              >
                ← Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
