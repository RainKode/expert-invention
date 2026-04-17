import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { can } from '@/lib/permissions'
import type { Role } from '@/types'
import { sanitizeFilterInput } from '@/lib/sanitize'

// GET /api/search?q=keyword&limit=5
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single()
  const role = (profile?.role ?? 'employee') as Role
  const teamId = profile?.team_id as string | null

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '5', 10), 20)

  if (q.length < 2) {
    return NextResponse.json({ tasks: [], projects: [], people: [], total: 0 })
  }

  const admin = createAdminClient()

  // --- Tasks: full-text search with role scoping ---
  const tsQuery = q.split(/\s+/).filter(Boolean).map(w => `${w}:*`).join(' & ')

  let taskQuery = admin
    .from('tasks')
    .select(`
      id, title, status, priority, assignee_id,
      assignee:profiles!tasks_assignee_id_fkey(id, name),
      project:projects(id, name)
    `)
    .textSearch('search_vector', tsQuery, { type: 'plain', config: 'english' })
    .neq('status', 'archived')
    .limit(limit)

  // Role-based scoping
  if (!can(role, 'view_team_tasks')) {
    // Employee: only own tasks
    taskQuery = taskQuery.or(
      `assignee_id.eq.${user.id},creator_id.eq.${user.id},reviewer_id.eq.${user.id}`
    )
  }
  // Managers/admins see all via admin client (bypasses RLS)

  const { data: tasks, error: taskErr } = await taskQuery
  if (taskErr) {
    // Fallback to ilike if tsvector not available
    const fallbackQuery = admin
      .from('tasks')
      .select(`
        id, title, status, priority, assignee_id,
        assignee:profiles!tasks_assignee_id_fkey(id, name),
        project:projects(id, name)
      `)
      .ilike('title', `%${sanitizeFilterInput(q)}%`)
      .neq('status', 'archived')
      .limit(limit)

    if (!can(role, 'view_team_tasks')) {
      fallbackQuery.or(
        `assignee_id.eq.${user.id},creator_id.eq.${user.id},reviewer_id.eq.${user.id}`
      )
    }

    const { data: fallbackTasks } = await fallbackQuery
    const taskResults = fallbackTasks ?? []

    // Still run projects + people
    const [projectRes, peopleRes] = await Promise.all([
      searchProjects(admin, q, limit),
      searchPeople(admin, q, role, teamId, user.id, limit),
    ])

    return NextResponse.json({
      tasks: taskResults,
      projects: projectRes,
      people: peopleRes,
      total: taskResults.length + projectRes.length + peopleRes.length,
    })
  }

  // --- Projects and People in parallel ---
  const [projectResults, peopleResults] = await Promise.all([
    searchProjects(admin, q, limit),
    searchPeople(admin, q, role, teamId, user.id, limit),
  ])

  return NextResponse.json({
    tasks: tasks ?? [],
    projects: projectResults,
    people: peopleResults,
    total: (tasks?.length ?? 0) + projectResults.length + peopleResults.length,
  })
}

async function searchProjects(
  admin: ReturnType<typeof createAdminClient>,
  q: string,
  limit: number
) {
  const { data } = await admin
    .from('projects')
    .select('id, name, team_id')
    .ilike('name', `%${q}%`)
    .limit(limit)
  return data ?? []
}

async function searchPeople(
  admin: ReturnType<typeof createAdminClient>,
  q: string,
  role: Role,
  teamId: string | null,
  userId: string,
  limit: number
) {
  let query = admin
    .from('profiles')
    .select('id, name, email, role, team_id')
    .or(`name.ilike.%${sanitizeFilterInput(q)}%,email.ilike.%${sanitizeFilterInput(q)}%`)
    .eq('status', 'active')
    .limit(limit)

  // Employees see only their team members
  if (!can(role, 'view_team_tasks') && teamId) {
    query = query.eq('team_id', teamId)
  }

  const { data } = await query
  return data ?? []
}
