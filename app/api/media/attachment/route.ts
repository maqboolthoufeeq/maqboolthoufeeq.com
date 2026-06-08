import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth-api'
import { uploadMediaAttachment } from '@/lib/blob'

/** Strip any path and cap the length of the client-supplied display filename. */
function safeName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name
  const trimmed = base.trim() || 'Attachment'
  return trimmed.length > 200 ? trimmed.slice(0, 200) : trimmed
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  try {
    const { url } = await uploadMediaAttachment(file)
    return NextResponse.json({
      url,
      name: safeName(file.name),
      size: file.size,
      type: file.type,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
