import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin
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
