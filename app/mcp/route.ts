/**
 * Hosted MCP endpoint — https://yourdomain.com/mcp/
 *
 * Implements the MCP Streamable HTTP transport (stateless per-request variant).
 * Every request must carry a valid OAuth Bearer token:
 *   Authorization: Bearer <access_token>
 *
 * Claude Desktop remote config:
 *   { "url": "https://yourdomain.com/mcp/",
 *     "headers": { "Authorization": "Bearer <token>" } }
 *
 * Tools can be enabled/disabled from the admin panel (/admin/mcp).
 * Disabled tools are hidden from tools/list and rejected at tools/call.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'
import { ALL_TOOLS, callTool } from './registry'
import { getPublicOrigin } from '@/lib/utils'

type JsonRpcRequest = {
  jsonrpc: '2.0'
  id?: string | number | null
  method: string
  params?: Record<string, unknown>
}

function rpcOk(id: string | number | null | undefined, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result })
}

function rpcErr(
  id: string | number | null | undefined,
  code: number,
  message: string,
  status = 200,
) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } }, { status })
}

async function getDisabledTools(): Promise<Set<string>> {
  const row = await prisma.siteContent.findUnique({ where: { key: 'mcp_config' } })
  const cfg = (row?.value ?? {}) as { disabledTools?: string[] }
  return new Set(cfg.disabledTools ?? [])
}

function unauthorizedResponse(req: NextRequest) {
  const origin = getPublicOrigin(req)
  return NextResponse.json(
    { error: 'Unauthorized' },
    {
      status: 401,
      headers: {
        'WWW-Authenticate': `Bearer realm="${origin}", resource_metadata="${origin}/.well-known/oauth-protected-resource"`,
      },
    },
  )
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return unauthorizedResponse(req)
  }

  // MCP Streamable HTTP requires JSON request bodies; reject anything else up front.
  const contentType = req.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return rpcErr(null, -32600, 'Unsupported Media Type: expected application/json', 415)
  }

  let body: JsonRpcRequest
  try {
    body = await req.json()
  } catch {
    return rpcErr(null, -32700, 'Parse error', 400)
  }

  const { id, method, params = {} } = body

  if (id === undefined || id === null) {
    return new NextResponse(null, { status: 202 })
  }

  try {
    switch (method) {
      case 'initialize':
        return rpcOk(id, {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'site-manager', version: '1.0.0' },
        })

      case 'ping':
        return rpcOk(id, {})

      case 'tools/list': {
        const disabled = await getDisabledTools()
        return rpcOk(id, { tools: ALL_TOOLS.filter((t) => !disabled.has(t.name)) })
      }

      case 'tools/call': {
        const { name: toolName, arguments: toolArgs = {} } =
          params as { name: string; arguments?: Record<string, unknown> }
        const disabled = await getDisabledTools()
        if (disabled.has(toolName)) {
          return rpcErr(id, -32601, `Tool "${toolName}" is disabled`)
        }
        const content = await callTool(toolName, toolArgs)
        return rpcOk(id, { content })
      }

      default:
        return rpcErr(id, -32601, `Method not found: ${method}`)
    }
  } catch (err) {
    // Log the full error server-side (incl. stack) for debugging. The endpoint is
    // authenticated, so returning the message to the admin caller is useful and not
    // a meaningful disclosure; we still send only `.message`, never the stack.
    console.error('[mcp] tool execution error:', { method, err })
    const message = err instanceof Error ? err.message : 'Internal server error'
    return rpcErr(id, -32000, message, 500)
  }
}

/**
 * GET is the MCP Streamable HTTP channel a client opens to receive
 * server-initiated (SSE) messages. This server is the stateless per-request
 * variant and never pushes anything, so per the spec we answer 405 — the signal
 * that tells a well-behaved client "there is no stream here, don't reconnect."
 *
 * Previously this returned a 200 JSON metadata blob, which is not a valid SSE
 * stream; some clients treat that as a broken stream and reconnect in a tight
 * loop (a likely contributor to the runaway `/mcp` Edge Request count). Returning
 * 405 immediately — before any auth/DB work — is both spec-correct and the
 * cheapest possible response. Nothing in-app consumes this endpoint.
 */
export function GET() {
  return new NextResponse('Method Not Allowed', {
    status: 405,
    headers: { Allow: 'POST', 'Cache-Control': 'no-store' },
  })
}
