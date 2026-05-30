import { NextResponse } from 'next/server'
import { recordPostView } from '@/lib/analytics'

type Params = { params: Promise<{ slug: string }> }

/**
 * Beacon hit once per genuine read of a published post (deduped client-side by
 * localStorage so a refresh doesn't inflate the count). Best-effort: any failure
 * is swallowed and never surfaces to the reader.
 */
export async function POST(_req: Request, { params }: Params) {
  const { slug } = await params
  try {
    const views = await recordPostView(slug)
    if (views === null) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ views })
  } catch (err) {
    console.error('POST /api/blog/[slug]/view', err)
    return new NextResponse(null, { status: 204 })
  }
}
