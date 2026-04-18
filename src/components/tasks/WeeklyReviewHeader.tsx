'use client'

import { motion } from 'framer-motion'
import { PALETTE, VENTURE_COLOURS, getContrastText } from '@/lib/colours'

interface CategoryStat {
  name: string
  count: number
  percentage: number
}

interface WeeklyReviewHeaderProps {
  weekLabel: string
  totalCompleted: number
  totalPlanned: number
  completionRate: number
  /** Velocity trend: positive = improving, negative = declining */
  velocityTrend: number
  /** Task breakdown by venture/category */
  categories: CategoryStat[]
  /** Current streak count */
  streakDays: number
  className?: string
}

export default function WeeklyReviewHeader({
  weekLabel,
  totalCompleted,
  totalPlanned,
  completionRate,
  velocityTrend,
  categories,
  streakDays,
  className = '',
}: WeeklyReviewHeaderProps) {
  return (
    <div className={`bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ${className}`}>
      {/* Top section: title + week label */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[1.5rem] font-bold tracking-tight text-on-surface">
            Weekly Review
          </h2>
          <p className="text-sm text-on-surface-variant mt-0.5">{weekLabel}</p>
        </div>

        {/* Streak badge */}
        {streakDays > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-happiness-10 ${streakDays >= 30 ? 'animate-streak-pulse' : ''}`}
          >
            <span className="material-symbols-outlined text-[16px] text-happiness">local_fire_department</span>
            <span className="text-sm font-bold text-on-surface">{streakDays}</span>
            <span className="text-[11px] text-on-surface-variant">day streak</span>
          </motion.div>
        )}
      </div>

      {/* KPI row — 3 stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Completion rate */}
        <div className="rounded-2xl p-4 bg-surface">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${completionRate >= 80 ? 'bg-kindness' : completionRate >= 50 ? 'bg-energetic' : 'bg-excitement'}`} />
            <span className="text-[11px] text-on-surface-variant font-medium">Completion Rate</span>
          </div>
          <div className="flex items-baseline gap-1">
            <motion.span
              key={completionRate}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`text-2xl font-bold ${completionRate >= 80 ? 'text-kindness' : completionRate >= 50 ? 'text-energetic' : 'text-excitement'}`}
            >
              {completionRate}%
            </motion.span>
          </div>
          <div className="mt-2 progress-bar">
            <motion.div
              className={`progress-fill ${completionRate >= 80 ? 'bg-kindness' : completionRate >= 50 ? 'bg-energetic' : 'bg-excitement'}`}
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />
          </div>
        </div>

        {/* Tasks completed */}
        <div className="rounded-2xl p-4 bg-surface">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-integrity" />
            <span className="text-[11px] text-on-surface-variant font-medium">Completed</span>
          </div>
          <div className="flex items-baseline gap-1">
            <motion.span
              key={totalCompleted}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-2xl font-bold text-on-surface"
            >
              {totalCompleted}
            </motion.span>
            <span className="text-sm text-on-surface-variant">/ {totalPlanned}</span>
          </div>
        </div>

        {/* Velocity trend */}
        <div className="rounded-2xl p-4 bg-surface">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${velocityTrend > 0 ? 'bg-natural' : velocityTrend < 0 ? 'bg-excitement' : 'bg-outline'}`} />
            <span className="text-[11px] text-on-surface-variant font-medium">Velocity</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`material-symbols-outlined text-[20px] ${velocityTrend > 0 ? 'text-natural' : velocityTrend < 0 ? 'text-excitement' : 'text-on-surface-variant'}`}>
              {velocityTrend > 0 ? 'trending_up' : velocityTrend < 0 ? 'trending_down' : 'trending_flat'}
            </span>
            <span className={`text-2xl font-bold ${velocityTrend > 0 ? 'text-natural' : velocityTrend < 0 ? 'text-excitement' : 'text-on-surface'}`}>
              {velocityTrend > 0 ? '+' : ''}{velocityTrend}%
            </span>
          </div>
        </div>
      </div>

      {/* Category breakdown — colour-coded bar */}
      {categories.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-on-surface-variant font-medium">Task Distribution</span>
          </div>

          {/* Stacked bar */}
          <div className="flex h-3 rounded-full overflow-hidden mb-3">
            {categories.map((cat, i) => {
              const venture = VENTURE_COLOURS[cat.name] ?? VENTURE_COLOURS['Other']
              return (
                <motion.div
                  key={cat.name}
                  initial={{ width: 0 }}
                  animate={{ width: `${cat.percentage}%` }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`${venture.bg} ${i === 0 ? 'rounded-l-full' : ''} ${i === categories.length - 1 ? 'rounded-r-full' : ''}`}
                  title={`${cat.name}: ${cat.count} tasks (${cat.percentage}%)`}
                />
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => {
              const venture = VENTURE_COLOURS[cat.name] ?? VENTURE_COLOURS['Other']
              return (
                <div key={cat.name} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${venture.bg}`} />
                  <span className="text-[10px] text-on-surface-variant">{cat.name}</span>
                  <span className="text-[10px] font-semibold text-on-surface">{cat.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
