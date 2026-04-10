'use client'

import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskWithRelations as Task } from '@/types'

const PRIORITY_BAR: Record<string, string> = {
  high: 'bg-error',
  medium: 'bg-tertiary',
  low: 'bg-outline',
}

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

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-surface-container-lowest rounded-2xl p-4 shadow-ambient-sm hover:shadow-ambient transition-shadow select-none ${isDragging ? 'shadow-ambient rotate-1' : ''}`}
    >
      {/* Priority bar + drag handle */}
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-1.5 rounded-full ${PRIORITY_BAR[task.priority] ?? 'bg-outline'}`} />
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
          <span className="w-5 h-5 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center text-[10px] font-bold">$</span>
        )}
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between gap-2">
        {/* Assignee avatar */}
        {task.assignee ? (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #4d556a 0%, #656d84 100%)' }}>
            {task.assignee.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-surface border-outline-variant/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-[12px] text-outline-variant">person</span>
          </div>
        )}

        {/* Due date */}
        {task.due_date && (
          <span className={`text-[10px] font-medium ${isOverdue ? 'text-error' : 'text-on-surface-variant'}`}>
            {isOverdue && <span className="material-symbols-outlined text-[10px] mr-0.5">warning</span>}
            {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  )
}
