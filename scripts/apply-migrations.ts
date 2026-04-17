/**
 * Sunday — Supabase Migration Runner
 * 
 * Reads all SQL migration files in order and runs them against your Supabase project.
 * 
 * Usage:
 *   1. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   2. Run: npx tsx scripts/apply-migrations.ts
 * 
 * IMPORTANT: This script runs ALL migrations in order. If your database already
 * has some tables, you may get "already exists" errors — those are safe to ignore.
 * For a clean setup, run against a fresh Supabase project.
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  console.error('   Make sure .env.local has both variables set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations')

async function runMigrations() {
  console.log('🗄️  Sunday — Supabase Migration Runner')
  console.log('=' .repeat(50))
  console.log(`📡 Target: ${SUPABASE_URL}`)
  console.log('')

  // Read migration files in order
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()

  console.log(`📋 Found ${files.length} migration files:\n`)

  let success = 0
  let failed = 0

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file)
    const sql = fs.readFileSync(filePath, 'utf-8')

    process.stdout.write(`  ⏳ ${file}... `)

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_string: sql })
      
      if (error) {
        // Try direct SQL via REST if RPC doesn't work
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY!,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY!}`,
          },
          body: JSON.stringify({ sql_string: sql }),
        })

        if (!resp.ok) {
          throw new Error(error.message || `HTTP ${resp.status}`)
        }
      }

      console.log('✅')
      success++
    } catch (err: any) {
      const msg = err?.message || String(err)
      if (msg.includes('already exists')) {
        console.log('⏭️  (already exists, skipping)')
        success++
      } else {
        console.log(`❌ ${msg.slice(0, 100)}`)
        failed++
      }
    }
  }

  console.log('\n' + '=' .repeat(50))
  console.log(`✅ ${success} succeeded, ❌ ${failed} failed`)

  if (failed > 0) {
    console.log('\n⚠️  Some migrations failed. You may need to run them manually via')
    console.log('   Supabase Dashboard → SQL Editor. Copy each .sql file content')
    console.log('   and run it as a new query.')
  }

  console.log('\n📋 Next steps:')
  console.log('   1. Create storage bucket "task-files" in Supabase Dashboard → Storage')
  console.log('   2. Enable pg_trgm extension in Dashboard → Database → Extensions')
  console.log('   3. Create your first admin user (see DEPLOYMENT-CHECKLIST.md)')
}

runMigrations().catch(console.error)
