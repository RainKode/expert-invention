// POST /api/reports/individual-employee
// Generates individual employee report (PDF or CSV)
// Access: manager and above (export_reports)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/permissions'
import type { Role } from '@/types'
import { generateIndividualReport } from '@/lib/reports/aggregation'
import { individualToCSV } from '@/lib/reports/csv'
import { individualToPDF, renderPDF } from '@/lib/reports/pdf'

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
  const employeeId = body.employee_id
  if (!employeeId) return NextResponse.json({ error: 'employee_id is required' }, { status: 400 })

  const dateFrom = body.date_from ?? getMonday()
  const dateTo = body.date_to ?? getSunday(dateFrom)
  const format = body.format === 'csv' ? 'csv' : 'pdf'

  const report = await generateIndividualReport(
    user.id, role, profile.team_id, profile.name, dateFrom, dateTo, employeeId,
  )

  if (format === 'csv') {
    const csv = individualToCSV(report)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="individual-${employeeId}-${dateFrom}.csv"`,
      },
    })
  }

  const docDef = individualToPDF(report)
  const buffer = await renderPDF(docDef)
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="individual-${employeeId}-${dateFrom}.pdf"`,
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
