#!/usr/bin/env pwsh
# ──────────────────────────────────────────────────────────────────────────────
# Sunday — Supabase Setup Script
# Run this once after cloning to set up the remote database.
# Prerequisites: Node.js, npx, Supabase account
# ──────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "`n=== Sunday Supabase Setup ===" -ForegroundColor Cyan

# 1. Check Supabase CLI
Write-Host "`n[1/5] Checking Supabase CLI..." -ForegroundColor Yellow
try {
    $version = npx supabase --version 2>&1
    Write-Host "  Supabase CLI v$version" -ForegroundColor Green
} catch {
    Write-Host "  Installing Supabase CLI..." -ForegroundColor Yellow
    npx supabase --version
}

# 2. Login check
Write-Host "`n[2/5] Checking authentication..." -ForegroundColor Yellow
$projects = npx supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Not logged in. Starting login..." -ForegroundColor Yellow
    npx supabase login
} else {
    Write-Host "  Already authenticated." -ForegroundColor Green
}

# 3. Link project
Write-Host "`n[3/5] Linking to remote project..." -ForegroundColor Yellow
npx supabase link --project-ref jbshqxszhzamvnlyrsyz
Write-Host "  Linked to jbshqxszhzamvnlyrsyz" -ForegroundColor Green

# 4. Push migrations
Write-Host "`n[4/5] Pushing migrations to remote..." -ForegroundColor Yellow
npx supabase db push
Write-Host "  Migrations applied." -ForegroundColor Green

# 5. Verify
Write-Host "`n[5/5] Verifying migration status..." -ForegroundColor Yellow
npx supabase migration list

Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host @"

Next steps:
  1. Copy .env.local.example to .env.local and fill in your keys
  2. Run 'npm run dev' to start the dev server
  3. Visit /setup to create the first admin user

Remote project: https://supabase.com/dashboard/project/jbshqxszhzamvnlyrsyz
"@ -ForegroundColor White
