import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/permissions';
import { z } from 'zod';

const VALID_ROLES = ['admin', 'planner', 'senior_manager', 'manager', 'team_leader', 'employee'] as const;
const VALID_BILLABLE = ['full', 'partial', 'none'] as const;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const BulkRowSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email'),
  role: z.enum(VALID_ROLES, { error: `Role must be one of: ${VALID_ROLES.join(', ')}` }),
  team_name: z.string().min(1, 'Team name is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  manager_email: z.string().email('Invalid manager email').optional().or(z.literal('')),
  work_week: z.string().optional(),
  available_hours: z.coerce.number().min(1).max(60).optional(),
  billable_permission: z.enum(VALID_BILLABLE).optional(),
});

type BulkRow = z.infer<typeof BulkRowSchema>;

interface RowResult {
  row: number;
  email: string;
  errors: string[];
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const check = requirePermission(profile?.role, 'manage_users_and_teams');
  if (!check.allowed) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  let rows: Record<string, string>[];
  try {
    const body = await request.json();
    rows = body.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
    }
    if (rows.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 rows per import' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Fetch existing data for validation
  const [{ data: teams }, { data: profiles }] = await Promise.all([
    admin.from('teams').select('id, name'),
    admin.from('profiles').select('id, email'),
  ]);

  const teamMap = new Map<string, string>(
    (teams ?? []).map((t: { id: string; name: string }) => [t.name.trim().toLowerCase(), t.id])
  );
  const existingEmails = new Set(
    (profiles ?? []).map((p: { email: string }) => p.email?.toLowerCase())
  );

  // Validate all rows first
  const validationErrors: RowResult[] = [];
  const seenEmails = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const rowErrors: string[] = [];

    const parsed = BulkRowSchema.safeParse({
      name: raw['name']?.trim(),
      email: raw['email']?.trim()?.toLowerCase(),
      role: raw['role']?.trim()?.toLowerCase(),
      team_name: raw['team_name']?.trim(),
      timezone: raw['timezone']?.trim(),
      manager_email: raw['manager_email']?.trim()?.toLowerCase() || '',
      work_week: raw['work_week']?.trim(),
      available_hours: raw['available_hours'] || undefined,
      billable_permission: raw['billable_permission']?.trim()?.toLowerCase() || undefined,
    });

    if (!parsed.success) {
      parsed.error.issues.forEach((e) => rowErrors.push(e.message));
    } else {
      const data = parsed.data;

      // Check email uniqueness in batch
      if (seenEmails.has(data.email)) {
        rowErrors.push('Duplicate email in import');
      } else {
        seenEmails.add(data.email);
      }

      // Check email not already in system
      if (existingEmails.has(data.email)) {
        rowErrors.push('Email already exists in the system');
      }

      // Check team exists
      if (!teamMap.has(data.team_name.toLowerCase())) {
        rowErrors.push(`Team "${data.team_name}" not found`);
      }

      // Validate work_week days
      if (data.work_week) {
        const days = data.work_week.split(',').map((d) => d.trim());
        const invalid = days.filter((d) => !DAYS.includes(d));
        if (invalid.length > 0) {
          rowErrors.push(`Invalid work_week days: ${invalid.join(', ')}. Use: Mon,Tue,Wed,Thu,Fri`);
        }
      }
    }

    if (rowErrors.length > 0) {
      validationErrors.push({ row: i + 1, email: raw['email'] ?? '', errors: rowErrors });
    }
  }

  // All-or-nothing: abort if any errors
  if (validationErrors.length > 0) {
    return NextResponse.json(
      { error: 'Validation failed', rowErrors: validationErrors },
      { status: 422 }
    );
  }

  // All rows valid — commit
  const created: string[] = [];
  const inviteTokens: { email: string; token: string }[] = [];
  const failedRows: RowResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const data = BulkRowSchema.parse({
      name: raw['name']?.trim(),
      email: raw['email']?.trim()?.toLowerCase(),
      role: raw['role']?.trim()?.toLowerCase(),
      team_name: raw['team_name']?.trim(),
      timezone: raw['timezone']?.trim(),
      manager_email: raw['manager_email']?.trim()?.toLowerCase() || '',
      work_week: raw['work_week']?.trim(),
      available_hours: raw['available_hours'] || undefined,
      billable_permission: raw['billable_permission']?.trim()?.toLowerCase() || undefined,
    }) as BulkRow;

    const teamId = teamMap.get(data.team_name.toLowerCase())!;

    // Find manager id if provided
    let managerId: string | null = null;
    if (data.manager_email) {
      const { data: mgr } = await admin
        .from('profiles')
        .select('id')
        .eq('email', data.manager_email)
        .single();
      managerId = mgr?.id ?? null;
    }

    // Create auth user
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: data.email,
      email_confirm: true,
      user_metadata: { name: data.name },
    });

    if (authError || !authUser.user) {
      failedRows.push({ row: i + 1, email: data.email, errors: [authError?.message ?? 'Failed to create user'] });
      continue;
    }

    const userId = authUser.user.id;
    const workWeek = data.work_week
      ? data.work_week.split(',').map((d) => d.trim())
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    // Update profile
    await admin.from('profiles').upsert({
      id: userId,
      name: data.name,
      email: data.email,
      role: data.role,
      team_id: teamId,
      manager_id: managerId,
      timezone: data.timezone,
      available_hours: data.available_hours ?? 8,
      work_week: workWeek,
      billable_permission: data.billable_permission ?? 'full',
      status: 'active',
      invite_accepted: false,
    });

    // Generate invite token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await admin.from('invite_tokens').insert({
      user_id: userId,
      token,
      expires_at: expiresAt,
      accepted: false,
    });

    // Audit log
    await admin.from('audit_log').insert({
      actor_id: user.id,
      action: 'bulk_invite_user',
      resource_type: 'user',
      resource_id: userId,
      metadata: { email: data.email, role: data.role },
    });

    created.push(data.email);
    inviteTokens.push({ email: data.email, token });
  }

  if (failedRows.length > 0) {
    return NextResponse.json(
      {
        partial: true,
        created: created.length,
        failed: failedRows.length,
        failedRows,
        inviteTokens,
      },
      { status: 207 }
    );
  }

  return NextResponse.json({
    success: true,
    created: created.length,
    inviteTokens,
  });
}
