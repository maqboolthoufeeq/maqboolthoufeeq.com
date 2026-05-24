import { NextRequest, NextResponse } from 'next/server'
import { getPublicOrigin } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const origin = getPublicOrigin(req)
  return NextResponse.json(
    {
      resource: `${origin}/mcp`,
      authorization_servers: [origin],
    },
    {
      headers: {
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    },
  )
}
