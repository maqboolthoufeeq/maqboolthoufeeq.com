import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getHubTopicForEdit } from '@/lib/hub'

/**
 * Admin-only: returns a topic in the editable shape (`HubTopicEditData`) used by
 * HubTopicForm — including its content blocks. Powers inline editing from the
 * public hub pages without navigating to /admin.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const data = await getHubTopicForEdit(id)
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
