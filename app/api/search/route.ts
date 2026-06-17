import { NextRequest, NextResponse } from 'next/server'
import { search } from '@/lib/search'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const query = (searchParams.get('q') ?? '').trim()
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') ?? '8')), 50)

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], total: 0, query })
  }

  const { results, total } = await search(query, limit)
  return NextResponse.json({ results, total, query })
}
