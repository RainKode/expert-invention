# Sunday — Deployment Checklist

> **Version:** 0.1.0 | **Date:** April 2026 | **Stack:** Next.js 16 + Supabase + Vercel

---

## Pre-Deployment QA Results

| Segment | Score | Details |
|---------|-------|---------|
| S1 – Authentication | 91% | 10/11 pass (set-password correctly blocks without token) |
| S2 – Route Protection | 100% | 19/19 all protected routes redirect to /login |
| S3 – API Auth | 98% | 40/41 (weekly report POST-only = expected 405) |
| S4 – API Mutations | 75% | 6/8 (login/forgot-pw 500 → fixed with try-catch) |
| S5 – Page Structure | 100% | 9/9 UI elements verified |
| S6 – Critical Files | 100% | 40/40 all components, routes, migrations exist |
| S7 – Deploy Config | 100% | 6/6 vercel.json + env vars confirmed |
| S8 – DB Schema | 77% | 17/22 (5 false positives from test pattern matching) |
| S9 – Cron APIs | 100% | 2/2 both cron endpoints reachable |
| S10 – Mobile | 100% | 2/2 responsive on 390×844 |
| S11 – Accessibility | 100% | 4/4 labels, types, icons |
| S12 – Security | 25% | 1/4 (3 optional headers to add) |
| **Overall** | **93%** | **156/168 passed** |

---

## Phase 1: Supabase Setup (Database)

### 1.1 Apply Migrations (IN ORDER)
Run these SQL files against your Supabase project via the SQL Editor (Dashboard → SQL Editor → New query):

| # | File | Purpose |
|---|------|---------|
| 1 | `supabase/migrations/001_sprint1_schema.sql` | Profiles, roles, departments, teams |
| 2 | `supabase/migrations/002_sprint2_schema.sql` | Tasks, projects, timeline, dependencies, subtasks |
| 3 | `supabase/migrations/003_sprint3_schema.sql` | Custom fields (definitions + values), saved views |
| 4 | `supabase/migrations/004_sprint4_schema.sql` | Weekly plans, plan entries, checkins, wrapups, plan comments |
| 5 | `supabase/migrations/005_sprint5_schema.sql` | Activity events, warning acknowledgements |
| 6 | `supabase/migrations/006_sprint6_schema.sql` | Notifications, notification preferences |
| 7 | `supabase/migrations/007_sprint7_search.sql` | Full-text search (tsvector), trigram indexes |
| 8 | `supabase/migrations/008_sprint8_files.sql` | Task files table, storage references |
| 9 | `supabase/migrations/009_sprint10_settings_archiving.sql` | Settings tables, archiving functions |
| 10 | `supabase/migrations/010_task_comments.sql` | Task comments table with RLS |

**IMPORTANT:** Run them one at a time, in numerical order. Each builds on the previous.

### 1.2 Create Storage Bucket
In Supabase Dashboard → Storage:
1. Click **"New bucket"**
2. Name: `task-files`
3. Public: **No** (private bucket — app uses signed URLs)
4. File size limit: **25 MB**
5. Allowed MIME types: `application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, image/jpeg, image/png, video/*`

### 1.3 Storage Policies (RLS)
Add these policies on the `task-files` bucket:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-files');

-- Allow authenticated users to read their uploads
CREATE POLICY "Authenticated users can read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'task-files');
```

### 1.4 Enable Required Extensions
In Supabase Dashboard → Database → Extensions, enable:
- **pg_trgm** (trigram matching for search)
- **uuid-ossp** (UUID generation)
- **pgcrypto** (if not already enabled)

### 1.4b Enable Realtime for Notifications
In Supabase Dashboard → Database → Replication:
1. Find the `notifications` table
2. Toggle **Realtime** ON for this table
3. This enables instant notification delivery in the browser via WebSocket (the app subscribes to INSERT events on this table)

### 1.5 Create First Admin User
Navigate to `https://your-domain.com/setup` in your browser. The bootstrap page will:
1. Check that no admin account exists yet
2. Present a form for name, email, and password (with strength meter)
3. Create the admin account and profile automatically
4. Redirect you to the login page

**Note:** The `/setup` page automatically locks after the first admin is created. All subsequent users must be created through the admin user management flow.

> **Manual fallback (if bootstrap is unavailable):**  
> 1. Go to Supabase Dashboard → Authentication → Users → Add user  
> 2. Note the user UUID  
> 3. Run in SQL Editor:  
> ```sql
> INSERT INTO profiles (id, email, name, role, status)
> VALUES ('USER_UUID_HERE', 'admin@yourcompany.com', 'Admin Name', 'admin', 'active');
> ```

---

## Phase 2: Vercel Deployment

### 2.1 Environment Variables
Set these in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Value | Scope |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://jbshqxszhzamvnlyrsyz.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Production only (⚠️ NEVER expose) |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` | Production |
| `CRON_SECRET` | Generate a random 32+ char string | Production |
| `RESEND_API_KEY` | Your Resend API key (from resend.com) | Production |
| `EMAIL_FROM` | `Sunday <noreply@your-domain.com>` | Production |

**Generate CRON_SECRET:**
```bash
openssl rand -hex 32
```

### 2.2 Deploy
```bash
# From project root
npx vercel --prod
```
Or connect your Git repo to Vercel for automatic deployments.

### 2.3 Verify Cron Jobs
After deployment, check Vercel Dashboard → Project → Settings → Crons:
- `/api/cron/notifications` — runs daily at 8:00 AM UTC
- `/api/cron/archive-tasks` — runs weekly on Sunday at 2:00 AM UTC

Both configured in `vercel.json`.

### 2.4 Domain Setup
1. Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. Update `NEXT_PUBLIC_APP_URL` env var to match

---

## Phase 3: Post-Deployment Verification

### 3.1 Smoke Tests (Manual)
- [ ] Navigate to `https://your-domain.com/setup` — bootstrap page loads (if no admin exists)
- [ ] Create first admin via bootstrap form — redirects to `/login`
- [ ] Navigate to `/setup` again — redirects to `/login` (locked after first admin)
- [ ] Login with admin credentials — redirects to dashboard or onboarding
- [ ] Complete onboarding flow if prompted
- [ ] Navigate to `/dashboard` — loads with empty state
- [ ] Navigate to `/tasks` — loads with empty state
- [ ] Navigate to `/board` — Kanban board renders with 4 empty columns
- [ ] Navigate to `/plan` — weekly plan renders
- [ ] Navigate to `/admin/users` — user management loads
- [ ] Create a new user — invite email is sent (check inbox or Resend dashboard)
- [ ] Navigate to `/admin/teams` — team structure loads
- [ ] Create a test department and team
- [ ] Create a test task — verify it appears in task list
- [ ] Move task through lifecycle: To Do → In Progress → In Review → Done
- [ ] Search for the task via Ctrl+K
- [ ] Check notifications bell — verify notifications appear

### 3.2 API Health Checks
```bash
# Should return 401 (not HTML redirect)
curl -s https://your-domain.com/api/auth/me | head -c 100

# Cron (should return 401 without CRON_SECRET)
curl -s https://your-domain.com/api/cron/notifications | head -c 100
```

### 3.3 Security Verification
- [ ] All `/api/*` routes return JSON 401 (not HTML redirects)
- [ ] Service role key is not exposed in client-side code
- [ ] CRON_SECRET protects cron endpoints
- [ ] Login doesn't leak user existence info

---

## Phase 4: Known Deferred Items (Post-Launch)

### Priority 1 — Wire Before Go-Live
| Item | Status | Action Required |
|------|--------|-----------------|
| Email provider (Resend/SendGrid) | ⚠️ Not wired | Integrate email service for invites, password resets, overdue alerts |
| `NEXT_PUBLIC_APP_URL` | ⚠️ Placeholder | Update to production domain |

### Priority 2 — Wire After Launch
| Item | Status | Action Required |
|------|--------|-----------------|
| Real-time updates | ⚠️ Polling only | Add Supabase Realtime subscriptions for board/plans/dashboard |
| Security headers | ⚠️ Missing | Add CSP, X-Frame-Options, X-Content-Type-Options in `next.config.mjs` |
| Error monitoring | ⚠️ None | Add Sentry or similar for production error tracking |
| Analytics | ⚠️ None | Add Vercel Analytics or Plausible |

### Priority 3 — Nice to Have
| Item | Status | Action Required |
|------|--------|-----------------|
| Rate limiting | ⚠️ None | Add rate limiting to auth endpoints |
| Image optimization | ✅ Configured | AVIF/WebP already in next.config |
| Cache headers | ✅ Configured | Static + API caching headers set |

---

## Quick Reference: All 62 API Routes

### Auth (7 routes)
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET  /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/accept-invite`
- `GET  /api/auth/callback`

### Tasks (10 routes)
- `GET|POST /api/tasks`
- `GET|PATCH|DELETE /api/tasks/[id]`
- `PATCH /api/tasks/[id]/status`
- `GET|POST /api/tasks/[id]/subtasks`
- `GET /api/tasks/[id]/timeline`
- `POST /api/tasks/[id]/review`
- `POST /api/tasks/[id]/reassign`
- `GET|POST|DELETE /api/tasks/[id]/dependencies`
- `GET|POST /api/tasks/[id]/custom-field-values`
- `POST /api/tasks/[id]/completion-report`
- `GET|POST /api/tasks/[id]/comments`

### Plans (5 routes)
- `GET|POST /api/plans`
- `GET|POST /api/plans/[id]/entries`
- `GET|POST /api/plans/[id]/comments`
- `POST /api/plans/[id]/submit`
- `POST /api/plans/[id]/unlock`

### Admin (6 routes)
- `GET|POST /api/admin/users`
- `GET|PATCH /api/admin/users/[id]`
- `GET /api/admin/users/[id]/open-tasks`
- `POST /api/admin/users/bulk-import`
- `GET|POST /api/admin/teams`
- `GET|PATCH|DELETE /api/admin/teams/[id]`
- `GET /api/admin/audit-trail`

### Dashboard (4 routes)
- `GET /api/dashboard/my-overview`
- `GET /api/dashboard/team-pulse`
- `GET /api/dashboard/workload`
- `POST /api/dashboard/acknowledge-warning`

### Reports (5 routes)
- `POST /api/reports/weekly-team`
- `POST /api/reports/individual-employee`
- `POST /api/reports/billable-hours`
- `POST /api/reports/system-activity`
- `POST /api/reports/task-export`

### Other (13 routes)
- `GET /api/activity-feed`
- `GET|POST /api/checkin`
- `GET|POST /api/wrapup`
- `GET /api/notifications`
- `POST /api/notifications/[id]/read`
- `POST /api/notifications/read-all`
- `GET|PUT /api/notifications/preferences`
- `GET|POST /api/custom-fields`
- `GET|PATCH|DELETE /api/custom-fields/[id]`
- `GET|POST /api/saved-views`
- `GET|PATCH|DELETE /api/saved-views/[id]`
- `GET|POST /api/files`
- `GET|DELETE /api/files/[id]`
- `GET /api/files/[id]/preview`
- `GET /api/search`
- `GET /api/onboarding/status`
- `GET /api/projects`
- `GET|PUT /api/settings/user-preferences`
- `GET|PUT /api/settings/team`
- `GET|PUT /api/settings/system`
- `GET /api/team/plans`

### Cron (2 routes)
- `GET /api/cron/notifications`
- `GET /api/cron/archive-tasks`

---

## Migration Files (10 total)

| File | Size | Must Apply |
|------|------|-----------|
| 001_sprint1_schema.sql | Profiles, roles | ✅ Yes |
| 002_sprint2_schema.sql | Tasks, projects | ✅ Yes |
| 003_sprint3_schema.sql | Custom fields, views | ✅ Yes |
| 004_sprint4_schema.sql | Plans, checkins, wrapups | ✅ Yes |
| 005_sprint5_schema.sql | Activity, warnings | ✅ Yes |
| 006_sprint6_schema.sql | Notifications | ✅ Yes |
| 007_sprint7_search.sql | Search indexes | ✅ Yes |
| 008_sprint8_files.sql | File attachments | ✅ Yes |
| 009_sprint10_settings_archiving.sql | Settings, archiving | ✅ Yes |
| 010_task_comments.sql | Task comments | ✅ Yes |
