'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface PendingTask {
  id: string
  title: string
  priority: string
  due_date: string | null
  status: string
}

interface OnboardingClientProps {
  employeeName: string
  teamName: string | null
  managerName: string | null
  pendingTasks: PendingTask[]
}

export default function OnboardingClient({
  employeeName,
  teamName,
  managerName,
  pendingTasks,
}: OnboardingClientProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const totalSteps = 3

  const firstName = employeeName.split(' ')[0]

  const completeOnboarding = useCallback(async () => {
    await fetch('/api/onboarding/status', { method: 'POST' })
    router.push('/plan')
    router.refresh()
  }, [router])

  const skipOnboarding = useCallback(async () => {
    await fetch('/api/onboarding/status', { method: 'POST' })
    router.push('/dashboard')
    router.refresh()
  }, [router])

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative blurred shapes */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary-container/20 blur-[120px]" />
      <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full bg-secondary-container/20 blur-[100px]" />

      {/* Progress header */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-8 py-5 bg-surface-container-lowest/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
          >
            <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
          </div>
          <span className="font-bold text-primary tracking-tight">Sunday</span>
        </div>
        <div className="flex items-center gap-3">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i + 1 === step
                  ? 'bg-primary-container scale-125'
                  : i + 1 < step
                    ? 'bg-primary-container/60'
                    : 'bg-surface-container-high'
              }`}
            />
          ))}
          <span className="text-xs text-on-surface-variant font-medium ml-2">
            Step {step} of {totalSteps}
          </span>
        </div>
      </header>

      <main className="relative z-10 pt-24 pb-16 px-6 max-w-3xl mx-auto">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center gap-10 pt-16">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-extrabold text-on-surface tracking-tight leading-tight">
                Welcome to Sunday,
                <br />
                <span className="bg-gradient-to-br from-[#4d556a] to-[#656d84] bg-clip-text text-transparent">
                  {firstName}
                </span>
              </h1>
              <p className="text-on-surface-variant text-lg max-w-md mx-auto">
                Your workspace is set up and ready. Let&apos;s get you oriented.
              </p>
            </div>

            {/* Bento chips */}
            <div className="flex flex-wrap justify-center gap-4">
              {teamName && (
                <div className="flex items-center gap-3 bg-surface-container-lowest px-6 py-4 rounded-2xl shadow-[0px_24px_48px_rgba(77,85,106,0.06)]">
                  <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-secondary-container">groups</span>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">Assigned Team</p>
                    <p className="font-bold text-on-surface">{teamName}</p>
                  </div>
                </div>
              )}
              {managerName && (
                <div className="flex items-center gap-3 bg-surface-container-lowest px-6 py-4 rounded-2xl shadow-[0px_24px_48px_rgba(77,85,106,0.06)]">
                  <div className="w-10 h-10 rounded-xl bg-tertiary-fixed flex items-center justify-center">
                    <span className="material-symbols-outlined text-tertiary-container">verified</span>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">Reporting Manager</p>
                    <p className="font-bold text-on-surface">{managerName}</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              className="mt-4 px-10 py-4 rounded-full text-white font-bold shadow-lg shadow-primary-container/20 hover:scale-[1.02] transition-transform active:scale-95 flex items-center gap-3"
              style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
            >
              <span>Let&apos;s go</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        )}

        {/* Step 2: Pending Tasks */}
        {step === 2 && (
          <div className="flex flex-col gap-8 pt-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-on-surface tracking-tight">Tasks waiting for you</h2>
              <p className="text-on-surface-variant">
                {pendingTasks.length > 0
                  ? `You have ${pendingTasks.length} task${pendingTasks.length > 1 ? 's' : ''} assigned.`
                  : 'No tasks assigned yet — your manager will assign some soon.'}
              </p>
            </div>

            {pendingTasks.length > 0 && (
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-surface-container-lowest p-5 rounded-xl shadow-[0px_24px_48px_rgba(77,85,106,0.06)] flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant">task_alt</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-on-surface truncate">{task.title}</p>
                      <p className="text-xs text-on-surface-variant">
                        {task.priority} priority
                        {task.due_date && ` • Due ${new Date(task.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-surface-container text-xs font-bold text-on-surface-variant capitalize">
                      {task.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-center pt-4">
              <button
                onClick={() => setStep(3)}
                className="px-10 py-4 rounded-full text-white font-bold shadow-lg shadow-primary-container/20 hover:scale-[1.02] transition-transform active:scale-95 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
              >
                <span>Continue</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Weekly Plan Prompt */}
        {step === 3 && (
          <div className="flex flex-col items-center gap-10 pt-12 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary-container/20 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-primary text-3xl">calendar_view_week</span>
              </div>
              <h2 className="text-3xl font-bold text-on-surface tracking-tight">Plan your first week</h2>
              <p className="text-on-surface-variant max-w-md mx-auto">
                Weekly planning keeps you focused and gives your manager visibility into what you&apos;re working on.
              </p>
            </div>

            {/* Day preview grid */}
            <div className="grid grid-cols-5 gap-3 w-full max-w-xl">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                <div
                  key={day}
                  className="bg-surface-container-low rounded-xl p-4 h-40 flex flex-col gap-2"
                >
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{day}</p>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-surface-container-high rounded-full w-full" />
                    <div className="h-3 bg-surface-container-high rounded-full w-3/4" />
                    <div className="h-3 bg-surface-container-high rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={completeOnboarding}
                className="px-10 py-4 rounded-full text-white font-bold shadow-lg shadow-primary-container/20 hover:scale-[1.02] transition-transform active:scale-95 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}
              >
                <span className="material-symbols-outlined">calendar_view_week</span>
                Go to My Plan
              </button>
              <button
                onClick={skipOnboarding}
                className="px-8 py-4 rounded-full text-on-surface-variant font-bold hover:bg-surface-container transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
