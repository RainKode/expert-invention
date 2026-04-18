/**
 * Psychology of Color — Status + Gamification Colour System
 *
 * This module maps task priority (deadline-driven) and task state (user behaviour)
 * to the 7-colour palette. Components import from here — never hardcode hex values.
 *
 * Rendering rules:
 * - Priority → left border of task card (4px)
 * - State → chip/badge inside the card
 * - When both are critical (e.g. overdue + blocked) → subtle 1px red glow, no double-fill
 */

// ─── Raw palette (used only when CSS classes won't work) ─────────────────────
export const PALETTE = {
  excitement: '#F72226',
  energetic:  '#FE5E20',
  happiness:  '#FFD527',
  natural:    '#24D56D',
  kindness:   '#00D6A3',
  integrity:  '#2226F7',
  originality:'#FF3797',
} as const

// ─── Priority (deadline-driven) → left border colour ────────────────────────
export type TaskPriorityState = 'overdue' | 'due-today' | 'due-this-week' | 'scheduled' | 'someday'

export const PRIORITY_BORDER_CLASS: Record<TaskPriorityState, string> = {
  'overdue':       'priority-border-overdue',
  'due-today':     'priority-border-due-today',
  'due-this-week': 'priority-border-due-week',
  'scheduled':     'priority-border-scheduled',
  'someday':       'priority-border-someday',
}

export const PRIORITY_BORDER_COLOR: Record<TaskPriorityState, string> = {
  'overdue':       PALETTE.excitement,
  'due-today':     PALETTE.energetic,
  'due-this-week': PALETTE.happiness,
  'scheduled':     PALETTE.natural,
  'someday':       'transparent',
}

// ─── State (user behaviour) → badge/chip ────────────────────────────────────
export type TaskBehaviourState =
  | 'focused'
  | 'in-progress'
  | 'blocked'
  | 'completed'
  | 'missed'
  | 'creative'

export const STATE_BADGE_CLASS: Record<TaskBehaviourState, string> = {
  'focused':     'badge badge-focused',
  'in-progress': 'badge badge-in-progress',
  'blocked':     'badge badge-blocked',
  'completed':   'badge badge-completed',
  'missed':      'badge badge-missed',
  'creative':    'badge badge-creative',
}

export const STATE_LABEL: Record<TaskBehaviourState, string> = {
  'focused':     'Focused',
  'in-progress': 'In Progress',
  'blocked':     'Blocked',
  'completed':   'Completed',
  'missed':      'Missed',
  'creative':    'Creative',
}

export const STATE_ICON: Record<TaskBehaviourState, string> = {
  'focused':     'center_focus_strong',
  'in-progress': 'pending',
  'blocked':     'block',
  'completed':   'check_circle',
  'missed':      'event_busy',
  'creative':    'palette',
}

// ─── Derive priority state from due_date + task status ──────────────────────
export function derivePriorityState(
  dueDate: string | null | undefined,
  status: string
): TaskPriorityState {
  if (status === 'done') return 'someday' // completed tasks don't show priority colour
  if (!dueDate) return 'someday'

  const now = new Date()
  const due = new Date(dueDate)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())

  const diffMs = dueDay.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'overdue'
  if (diffDays === 0) return 'due-today'
  if (diffDays <= 7) return 'due-this-week'
  return 'scheduled'
}

// ─── Derive behaviour state from task status + context ──────────────────────
export function deriveBehaviourState(
  status: string,
  opts?: { isFocused?: boolean; isBlocked?: boolean; isCreative?: boolean }
): TaskBehaviourState {
  if (opts?.isFocused) return 'focused'
  if (opts?.isBlocked) return 'blocked'
  if (opts?.isCreative) return 'creative'

  switch (status) {
    case 'done': return 'completed'
    case 'in_progress': return 'in-progress'
    case 'in_review': return 'in-progress'
    default: return 'in-progress'
  }
}

// ─── Check if a task is in critical state (needs glow) ──────────────────────
export function isCriticalState(
  priorityState: TaskPriorityState,
  behaviourState: TaskBehaviourState
): boolean {
  return (
    (priorityState === 'overdue' && behaviourState === 'blocked') ||
    (priorityState === 'overdue' && behaviourState === 'missed')
  )
}

// ─── Progress bar colour (per-task) ─────────────────────────────────────────
export function getProgressColour(percent: number): string {
  if (percent >= 100) return 'bg-kindness'
  if (percent >= 67) return 'bg-natural'
  if (percent >= 34) return 'bg-happiness'
  return 'bg-energetic'
}

// ─── Velocity chart bar colours ─────────────────────────────────────────────
export function getVelocityBarColour(
  actual: number,
  target: number,
  hasMissedDeadline?: boolean
): string {
  if (hasMissedDeadline) return 'bg-excitement'
  if (actual > target) return 'bg-natural'
  if (actual < target) return 'bg-energetic'
  return 'bg-integrity'
}

// ─── Venture-to-colour mapping (locked assignments) ─────────────────────────
export const VENTURE_COLOURS: Record<string, { bg: string; text: string; hex: string }> = {
  'Better Block':  { bg: 'bg-integrity',   text: 'text-white',      hex: PALETTE.integrity },
  'Akino':         { bg: 'bg-originality',  text: 'text-white',      hex: PALETTE.originality },
  'RainKode':      { bg: 'bg-kindness',     text: 'text-on-surface', hex: PALETTE.kindness },
  'Magpie Nest':   { bg: 'bg-natural',      text: 'text-on-surface', hex: PALETTE.natural },
  'Sunday':        { bg: 'bg-happiness',    text: 'text-on-surface', hex: PALETTE.happiness },
  'Other':         { bg: 'bg-energetic',    text: 'text-white',      hex: PALETTE.energetic },
}

// ─── Accountability partner states ──────────────────────────────────────────
export type PairState = 'both-on-track' | 'one-slipping' | 'both-slipping'

export const PAIR_STATE_COLOUR: Record<PairState, { ring: string; bg: string; hex: string }> = {
  'both-on-track': { ring: 'ring-integrity',  bg: 'bg-integrity-10',  hex: PALETTE.integrity },
  'one-slipping':  { ring: 'ring-energetic',  bg: 'bg-energetic-10',  hex: PALETTE.energetic },
  'both-slipping': { ring: 'ring-excitement', bg: 'bg-excitement-10', hex: PALETTE.excitement },
}

// ─── WCAG contrast: which colours need dark text? ───────────────────────────
export const DARK_TEXT_COLOURS = new Set(['happiness', 'kindness', 'natural'])
export function getContrastText(colour: keyof typeof PALETTE): string {
  return DARK_TEXT_COLOURS.has(colour) ? 'text-on-surface' : 'text-white'
}
