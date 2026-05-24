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

type JsonRpcRequest = {
  jsonrpc: '2.0'
  id?: string | number | null
  method: string
  params?: Record<string, unknown>
}

function rpcOk(id: string | number | null | undefined, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result })
}

function rpcErr(id: string | number | null | undefined, code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } })
}

async function getDisabledTools(): Promise<Set<string>> {
  const row = await prisma.siteContent.findUnique({ where: { key: 'mcp_config' } })
  const cfg = (row?.value ?? {}) as { disabledTools?: string[] }
  return new Set(cfg.disabledTools ?? [])
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: JsonRpcRequest
  try {
    body = await req.json()
  } catch {
    return rpcErr(null, -32700, 'Parse error')
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
    const message = err instanceof Error ? err.message : String(err)
    return rpcErr(id, -32000, message)
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const disabled = await getDisabledTools()
  const enabledTools = ALL_TOOLS.filter((t) => !disabled.has(t.name))
  return NextResponse.json({
    name: 'site-manager',
    version: '1.0.0',
    transport: 'streamable-http',
    toolCount: enabledTools.length,
    tools: enabledTools.map((t) => t.name),
  })
}
