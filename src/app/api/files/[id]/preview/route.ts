import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'task-files'
const SIGNED_URL_EXPIRY = 3600 // 1 hour

type Params = { params: Promise<{ id: string }> }

// Generate a signed URL for in-app preview (PDF/image)
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

  // Check if file type supports in-app preview
  const previewable = file.file_type.startsWith('image/') || file.file_type === 'application/pdf'

  const { data: signed, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(file.storage_path, SIGNED_URL_EXPIRY)

  if (error || !signed) {
    return NextResponse.json({ error: 'Could not generate preview URL' }, { status: 500 })
  }

  return NextResponse.json({
    url: signed.signedUrl,
    filename: file.filename,
    file_type: file.file_type,
    file_size: file.file_size,
    previewable,
  })
}
