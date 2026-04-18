'use client'

import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskWithRelations as Task } from '@/types'
import {
  derivePriorityState,
  deriveBehaviourState,
  PRIORITY_BORDER_CLASS,
  STATE_BADGE_CLASS,
  STATE_LABEL,
  STATE_ICON,
  isCriticalState,
} from '@/lib/colours'

interface Props {
  task: Task
  userId: string
  isDragging?: boolean
}

export default function KanbanCard({ task, userId: _userId, isDragging }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }

  const priorityState = derivePriorityState(task.due_date, task.status)
  const behaviourState = deriveBehaviourState(task.status)
  const critical = isCriticalState(priorityState, behaviourState)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-2xl p-4 shadow-[0px_2px_12px_rgba(77,85,106,0.08)] hover:shadow-[0px_8px_24px_rgba(77,85,106,0.12)] transition-all duration-200 select-none ${PRIORITY_BORDER_CLASS[priorityState]} ${critical ? 'critical-glow' : ''} ${isDragging ? 'shadow-[0px_12px_32px_rgba(77,85,106,0.15)] rotate-1 scale-105' : ''}`}
    >
      {/* State badge + drag handle */}
      <div className="flex items-center justify-between mb-3">
        <span className={`${STATE_BADGE_CLASS[behaviourState]} text-[11px] gap-1`}>
          <span className="material-symbols-outlined text-[12px]">{STATE_ICON[behaviourState]}</span>
          {STATE_LABEL[behaviourState]}
        </span>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 -mr-1 text-outline-variant hover:text-on-surface-variant transition-colors"
          title="Drag to move"
        >
          <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
        </div>
      </div>

      {/* Title */}
      <Link
        href={`/tasks/${task.id}`}
        className="block text-sm font-semibold text-on-surface hover:text-primary leading-snug mb-2 transition-colors line-clamp-2"
        onClick={e => e.stopPropagation()}
      >
        {task.title}
      </Link>

      {/* Tags row */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {task.project && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface text-on-surface-variant">
            {task.project.name}
          </span>
        )}
        {task.task_nature && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface text-on-surface-variant capitalize">
            {task.task_nature}
          </span>
        )}
        {task.billable && (
          <span className="w-5 h-5 rounded-full bg-kindness-10 text-kindness flex items-center justify-center text-[10px] font-bold">$</span>
        )}
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between gap-2">
        {/* Assignee avatar */}
        {task.assignee ? (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold bg-integrity text-white flex-shrink-0">
            {task.assignee.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-surface border-outline-variant/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-[12px] text-outline-variant">person</span>
          </div>
        )}

        {/* Due date */}
        {task.due_date && (
          <span className={`text-[10px] font-medium flex items-center gap-0.5 ${priorityState === 'overdue' ? 'text-excitement' : priorityState === 'due-today' ? 'text-energetic' : 'text-on-surface-variant'}`}>
            {priorityState === 'overdue' && <span className="material-symbols-outlined text-[10px]">warning</span>}
            {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  )
}
