// POST /api/reports/task-export
// Full task export with all fields + custom fields (CSV only)
// Access: manager and above (export_reports)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/permissions'
import type { Role } from '@/types'
import { generateTaskExport } from '@/lib/reports/aggregation'
import { taskExportToCSV } from '@/lib/reports/csv'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('name, role, team_id')
    .eq('id', user.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const role = profile.role as Role
  const perm = requirePermission(role, 'export_reports')
  if (!perm.allowed) return NextResponse.json({ error: perm.error }, { status: perm.status })

  const body = await request.json()
  const dateFrom = body.date_from ?? getMonday()
  const dateTo = body.date_to ?? getSunday(dateFrom)
  const teamId = body.team_id ?? null

  const rows = await generateTaskExport(
    user.id, role, profile.team_id, profile.name, dateFrom, dateTo, teamId,
  )

  const csv = taskExportToCSV(rows)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="task-export-${dateFrom}.csv"`,
    },
  })
}

function getMonday(): string {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d.toISOString().split('T')[0]
}

function getSunday(monday: string): string {
  const d = new Date(monday)
  d.setDate(d.getDate() + 6)
  return d.toISOString().split('T')[0]
}
