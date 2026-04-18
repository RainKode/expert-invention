'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskWithRelations as Task } from '@/types'
import KanbanCard from './KanbanCard'

interface Props {
  id: string
  label: string
  color: string
  tasks: Task[]
  loading: boolean
  userId: string
}

export default function KanbanColumn({ id, label, color, tasks, loading, userId }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2.5 mb-4 px-1">
        <span className={`w-3 h-3 rounded-full ${color} shadow-sm`} />
        <h2 className="text-sm font-bold text-on-surface">{label}</h2>
        <span className="ml-auto text-xs font-bold text-on-surface-variant bg-white px-2.5 py-0.5 rounded-full shadow-[0px_1px_4px_rgba(77,85,106,0.1)]">
          {tasks.length}
        </span>
      </div>

      {/* Droppable column body */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-3 flex-1 rounded-2xl transition-colors min-h-[120px] p-2 ${
          isOver ? 'bg-integrity-10 ring-2 ring-integrity/20' : 'bg-surface-container-low'
        }`}
        style={{ height: 'calc(100vh - 280px)', overflowY: 'auto', scrollbarWidth: 'none' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <span className="material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span>
          </div>
        ) : (
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map(task => (
              <KanbanCard key={task.id} task={task} userId={userId} />
            ))}
            {tasks.length === 0 && (
              <div className="flex items-center justify-center h-20 text-xs text-on-surface-variant/50">
                No tasks
              </div>
            )}
          </SortableContext>
        )}
      </div>
    </div>
  )
}
