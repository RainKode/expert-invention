'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  derivePriorityState,
  deriveBehaviourState,
  PRIORITY_BORDER_CLASS,
  STATE_BADGE_CLASS,
  STATE_LABEL,
  STATE_ICON,
  isCriticalState,
  type TaskPriorityState,
  type TaskBehaviourState,
} from '@/lib/colours'

interface TaskCardProps {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  projectName?: string | null
  taskNature?: string | null
  billable?: boolean
  assigneeName?: string | null
  estimatedHours?: number | null
  actualHours?: number | null
  isFocused?: boolean
  isBlocked?: boolean
  isCreative?: boolean
  onClick?: () => void
  className?: string
}

/**
 * TaskCard — Psychology of Color integrated task card
 *
 * Renders the hybrid mapping:
 * - Priority (deadline-driven) → 4px left border
 * - State (user behaviour) → chip/badge inside card
 * - Critical state (overdue + blocked) → subtle red glow
 */
export default function TaskCard({
  id: _id,
  title,
  status,
  dueDate,
  projectName,
  taskNature,
  billable,
  assigneeName,
  estimatedHours,
  actualHours,
  isFocused,
  isBlocked,
  isCreative,
  onClick,
  className = '',
}: TaskCardProps) {
  const priorityState: TaskPriorityState = derivePriorityState(dueDate, status)
  const behaviourState: TaskBehaviourState = deriveBehaviourState(status, { isFocused, isBlocked, isCreative })
  const critical = isCriticalState(priorityState, behaviourState)

  // Progress percentage from hours
  const progress = estimatedHours && estimatedHours > 0
    ? Math.min(100, Math.round(((actualHours ?? 0) / estimatedHours) * 100))
    : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={onClick}
      className={`
        bg-white rounded-2xl p-4
        shadow-[0px_2px_8px_rgba(77,85,106,0.06)] hover:shadow-[0px_4px_24px_rgba(77,85,106,0.08)]
        transition-shadow cursor-pointer
        ${PRIORITY_BORDER_CLASS[priorityState]}
        ${critical ? 'critical-glow' : ''}
        ${className}
      `}
    >
      {/* Top row: state badge + due indicator */}
      <div className="flex items-center justify-between mb-2">
        <span className={`${STATE_BADGE_CLASS[behaviourState]} text-[11px] gap-1`}>
          <span className="material-symbols-outlined text-[12px]">{STATE_ICON[behaviourState]}</span>
          {STATE_LABEL[behaviourState]}
        </span>

        {dueDate && priorityState !== 'someday' && (
          <span className={`text-[10px] font-medium flex items-center gap-0.5 ${
            priorityState === 'overdue' ? 'text-excitement' : 'text-on-surface-variant'
          }`}>
            {priorityState === 'overdue' && (
              <span className="material-symbols-outlined text-[10px]">warning</span>
            )}
            {new Date(dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-on-surface leading-snug mb-2 line-clamp-2">
        {title}
      </h4>

      {/* Tags row */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {projectName && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface text-on-surface-variant">
            {projectName}
          </span>
        )}
        {taskNature && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface text-on-surface-variant capitalize">
            {taskNature}
          </span>
        )}
        {billable && (
          <span className="w-5 h-5 rounded-full bg-kindness-10 text-kindness flex items-center justify-center text-[10px] font-bold">$</span>
        )}
      </div>

      {/* Progress bar (if hours tracked) */}
      <AnimatePresence>
        {progress !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-on-surface-variant">Progress</span>
              <span className="text-[10px] font-medium text-on-surface-variant">{progress}%</span>
            </div>
            <div className="progress-bar">
              <motion.div
                className={`progress-fill ${
                  progress >= 100 ? 'bg-kindness' :
                  progress >= 67 ? 'bg-natural' :
                  progress >= 34 ? 'bg-happiness' :
                  'bg-energetic'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom row: assignee */}
      {assigneeName && (
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #2226F7 0%, #00D6A3 100%)' }}
          >
            {assigneeName.charAt(0).toUpperCase()}
          </div>
          <span className="text-[11px] text-on-surface-variant truncate">{assigneeName}</span>
        </div>
      )}
    </motion.div>
  )
}
