// POST /api/reports/system-activity
// Generates system activity report (CSV only — no PDF for raw events)
// Access: admin only (view_audit_trail)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/permissions'
import type { Role } from '@/types'
import { generateSystemActivityReport } from '@/lib/reports/aggregation'
import { systemActivityToCSV } from '@/lib/reports/csv'

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
  // System activity requires admin-only audit trail permission
  const perm = requirePermission(role, 'view_audit_trail')
  if (!perm.allowed) return NextResponse.json({ error: perm.error }, { status: perm.status })

  const body = await request.json()
  const dateFrom = body.date_from ?? getMonday()
  const dateTo = body.date_to ?? getSunday(dateFrom)

  const report = await generateSystemActivityReport(profile.name, dateFrom, dateTo)

  const csv = systemActivityToCSV(report)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="system-activity-${dateFrom}.csv"`,
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
