import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'task-files'

type Params = { params: Promise<{ id: string }> }

// Download file — returns the actual file with correct content-type
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: file } = await admin
    .from('task_files')
    .select('*')
    .eq('id', id)
    .single()

  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  const { data: blob, error } = await admin.storage
    .from(BUCKET)
    .download(file.storage_path)

  if (error || !blob) {
    return NextResponse.json({ error: 'File download failed' }, { status: 500 })
  }

  const buffer = Buffer.from(await blob.arrayBuffer())

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': file.file_type,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      'Content-Length': String(buffer.length),
    },
  })
}
