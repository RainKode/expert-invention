'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Small task completion checkmark ────────────────────────────────────────
interface CheckmarkAnimationProps {
  show: boolean
  onComplete?: () => void
}

export function CheckmarkAnimation({ show, onComplete }: CheckmarkAnimationProps) {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15, duration: 0.3 }}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-kindness"
        >
          <motion.span
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            className="material-symbols-outlined text-[18px] text-on-surface"
          >
            check
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Milestone task completion — gradient sweep ─────────────────────────────
interface MilestoneSweepProps {
  show: boolean
  onComplete?: () => void
}

export function MilestoneSweep({ show, onComplete }: MilestoneSweepProps) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(() => onComplete?.(), 800)
      return () => clearTimeout(t)
    }
  }, [show, onComplete])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-10"
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 w-1/2"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(0, 214, 163, 0.15), rgba(255, 213, 39, 0.15), transparent)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Daily goal confetti moment ─────────────────────────────────────────────
interface ConfettiMomentProps {
  show: boolean
  onComplete?: () => void
}

const CONFETTI_PIECES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  color: ['#FFD527', '#00D6A3', '#2226F7', '#FF3797', '#24D56D', '#FE5E20'][i % 6],
  x: Math.random() * 100 - 50,
  y: -(Math.random() * 120 + 40),
  rotation: Math.random() * 720 - 360,
  scale: Math.random() * 0.5 + 0.5,
  delay: Math.random() * 0.3,
}))

export function ConfettiMoment({ show, onComplete }: ConfettiMomentProps) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(() => onComplete?.(), 1500)
      return () => clearTimeout(t)
    }
  }, [show, onComplete])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
        >
          {/* Center burst text */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            className="text-center"
          >
            <div className="text-4xl font-bold text-happiness mb-1" style={{ textShadow: '0 0 20px rgba(255, 213, 39, 0.3)' }}>
              <span className="material-symbols-outlined text-[40px]">celebration</span>
            </div>
            <p className="text-sm font-semibold text-on-surface">Daily Goal Met!</p>
          </motion.div>

          {/* Confetti pieces */}
          {CONFETTI_PIECES.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                x: piece.x * 3,
                y: piece.y,
                scale: piece.scale,
                rotate: piece.rotation,
                opacity: 0,
              }}
              transition={{
                duration: 1.2,
                delay: piece.delay,
                ease: 'easeOut',
              }}
              className="absolute w-3 h-3 rounded-sm"
              style={{ backgroundColor: piece.color }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Task completion wrapper — detects type and renders appropriate animation ─
interface TaskCompletionAnimationProps {
  /** 'small' = regular task, 'milestone' = priority/long-running */
  type: 'small' | 'milestone' | 'daily-goal'
  show: boolean
  onComplete?: () => void
}

export default function TaskCompletionAnimation({
  type,
  show,
  onComplete,
}: TaskCompletionAnimationProps) {
  const [visible, setVisible] = useState(show)

  useEffect(() => {
    setVisible(show)
  }, [show])

  const handleComplete = useCallback(() => {
    setVisible(false)
    onComplete?.()
  }, [onComplete])

  switch (type) {
    case 'small':
      return <CheckmarkAnimation show={visible} onComplete={handleComplete} />
    case 'milestone':
      return <MilestoneSweep show={visible} onComplete={handleComplete} />
    case 'daily-goal':
      return <ConfettiMoment show={visible} onComplete={handleComplete} />
    default:
      return null
  }
}
