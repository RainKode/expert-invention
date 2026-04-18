'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StreakCounterProps {
  currentStreak: number
  longestStreak: number
  /** Whether the streak just broke (triggers flash animation) */
  justBroke?: boolean
  /** Whether the streak just resumed (triggers gradient animation) */
  justResumed?: boolean
  /** Callback to retry / restart streak */
  onRetry?: () => void
  className?: string
}

const MILESTONES = [7, 14, 30, 60, 90, 180, 365]

function getMilestoneLevel(streak: number): 'normal' | 'milestone' | 'epic' {
  if (streak >= 30) return 'epic'
  if (MILESTONES.some(m => streak >= m)) return 'milestone'
  return 'normal'
}

function getNextMilestone(streak: number): number {
  return MILESTONES.find(m => m > streak) ?? streak + 7
}

export default function StreakCounter({
  currentStreak,
  longestStreak,
  justBroke = false,
  justResumed = false,
  onRetry,
  className = '',
}: StreakCounterProps) {
  const [showBreakFlash, setShowBreakFlash] = useState(justBroke)
  const [showResumeGlow, setShowResumeGlow] = useState(justResumed)

  const milestoneLevel = getMilestoneLevel(currentStreak)
  const nextMilestone = getNextMilestone(currentStreak)
  const progressToNext = Math.min(100, Math.round((currentStreak / nextMilestone) * 100))

  // Auto-dismiss break flash after 400ms
  useEffect(() => {
    if (justBroke) {
      setShowBreakFlash(true)
      const t = setTimeout(() => setShowBreakFlash(false), 400)
      return () => clearTimeout(t)
    }
  }, [justBroke])

  // Auto-dismiss resume glow after 800ms
  useEffect(() => {
    if (justResumed) {
      setShowResumeGlow(true)
      const t = setTimeout(() => setShowResumeGlow(false), 800)
      return () => clearTimeout(t)
    }
  }, [justResumed])

  return (
    <div className={`relative ${className}`}>
      {/* Break flash overlay */}
      <AnimatePresence>
        {showBreakFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 rounded-2xl animate-streak-break-flash pointer-events-none z-10"
          />
        )}
      </AnimatePresence>

      <div
        className={`
          bg-surface-container-lowest rounded-2xl p-5 shadow-ambient-sm
          transition-all duration-200
          ${milestoneLevel === 'epic' ? 'animate-streak-pulse' : ''}
          ${showResumeGlow ? 'shadow-glow-kindness' : ''}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-[20px] ${
              currentStreak === 0 ? 'text-on-surface-variant' :
              milestoneLevel === 'epic' ? 'text-happiness' :
              milestoneLevel === 'milestone' ? 'text-happiness' :
              'text-natural'
            }`}>
              local_fire_department
            </span>
            <span className="text-sm font-semibold text-on-surface">Streak</span>
          </div>

          {currentStreak > 0 && milestoneLevel !== 'normal' && (
            <span className="badge bg-happiness-10 text-on-surface text-[10px] font-bold">
              <span className="material-symbols-outlined text-[10px] mr-0.5">emoji_events</span>
              {milestoneLevel === 'epic' ? 'Epic' : 'Milestone'}
            </span>
          )}
        </div>

        {/* Counter */}
        <div className="flex items-baseline gap-2 mb-1">
          <motion.span
            key={currentStreak}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`text-3xl font-bold tracking-tight ${
              currentStreak === 0 ? 'text-on-surface-variant' :
              milestoneLevel === 'epic' ? 'text-happiness' :
              'text-on-surface'
            }`}
          >
            {currentStreak}
          </motion.span>
          <span className="text-sm text-on-surface-variant">
            {currentStreak === 1 ? 'day' : 'days'}
          </span>
        </div>

        {/* Progress to next milestone */}
        {currentStreak > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-on-surface-variant">
                Next milestone: {nextMilestone} days
              </span>
              <span className="text-[10px] font-medium text-on-surface-variant">
                {progressToNext}%
              </span>
            </div>
            <div className="progress-bar">
              <motion.div
                className={`progress-fill ${
                  showResumeGlow ? 'bg-gradient-to-r from-natural to-kindness' :
                  milestoneLevel === 'epic' ? 'bg-happiness' :
                  'bg-natural'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Longest streak */}
        <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
          <span>Longest streak</span>
          <span className="font-semibold">{longestStreak} days</span>
        </div>

        {/* Break state — retry CTA */}
        <AnimatePresence>
          {currentStreak === 0 && !showBreakFlash && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-outline-variant/15"
            >
              <p className="text-[11px] text-on-surface-variant mb-3">
                Your streak ended. Complete today&apos;s tasks to start a new one.
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="btn-focus text-[12px] py-2 px-4 w-full"
                >
                  <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                  Start New Streak
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
