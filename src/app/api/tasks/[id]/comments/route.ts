import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logTimelineEvent } from '@/lib/task-timeline'
import { createNotification } from '@/lib/notifications'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const commentSchema = z.object({
  text: z.string().min(1, 'Comment cannot be empty').max(5000),
})

// GET /api/tasks/:id/comments — list comments for a task
export async function GET(_: NextRequest, { params }: Params) {
  const { id: taskId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: comments, error } = await admin
    .from('task_comments')
    .select(`
      id, task_id, author_id, text, created_at,
      author:profiles!task_comments_author_id_fkey(id, name)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: comments ?? [] })
}

// POST /api/tasks/:id/comments — add a comment
export async function POST(request: NextRequest, { params }: Params) {
  const { id: taskId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = commentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  // Verify task exists
  const admin = createAdminClient()
  const { data: task } = await admin.from('tasks').select('id, title, assignee_id, creator_id, reviewer_id').eq('id', taskId).single()
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  // Insert comment
  const { data: comment, error } = await admin
    .from('task_comments')
    .insert({
      task_id: taskId,
      author_id: user.id,
      text: parsed.data.text,
    })
    .select(`
      id, task_id, author_id, text, created_at,
      author:profiles!task_comments_author_id_fkey(id, name)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log timeline event
  await logTimelineEvent({
    taskId,
    eventType: 'comment_added',
    actorId: user.id,
    newValue: parsed.data.text.substring(0, 200),
  })

  // Notify involved parties (assignee, creator, reviewer) — but not the author
  const { data: authorProfile } = await admin.from('profiles').select('name').eq('id', user.id).single()
  const authorName = authorProfile?.name ?? 'Someone'

  const recipientIds = new Set<string>()
  if (task.assignee_id && task.assignee_id !== user.id) recipientIds.add(task.assignee_id)
  if (task.creator_id && task.creator_id !== user.id) recipientIds.add(task.creator_id)
  if (task.reviewer_id && task.reviewer_id !== user.id) recipientIds.add(task.reviewer_id)

  for (const recipientId of recipientIds) {
    await createNotification({
      recipientId,
      type: 'comment_on_task',
      title: 'New comment on task',
      message: `${authorName} commented on "${task.title}"`,
      link: `/tasks/${taskId}`,
      metadata: { task_id: taskId, comment_id: comment.id },
    })
  }

  return NextResponse.json({ comment }, { status: 201 })
}
