import { prisma } from '@/lib/prisma'
import type { ToolDef, ToolContent } from '../types'
import { text } from '../types'

export const TOOLS: ToolDef[] = [
  {
    name: 'list_contact_requests',
    description:
      'List contact form submissions from the site inbox. ' +
      'Returns: id, name, email, message, attachmentUrl, attachmentName, attachmentSize, read, createdAt. ' +
      'Use unreadOnly:true to fetch only unread messages. ' +
      'Results are ordered newest-first (default limit: 50).',
    inputSchema: {
      type: 'object',
      properties: {
        unreadOnly: { type: 'boolean', description: 'true = unread messages only' },
        limit: { type: 'number', description: 'Max results to return (default: 50)' },
      },
    },
  },
  {
    name: 'mark_contact_read',
    description: 'Mark a contact form submission as read or unread.',
    inputSchema: {
      type: 'object',
      properties: {
        id:   { type: 'string', description: 'ContactRequest ID (cuid)' },
        read: { type: 'boolean', description: 'true = mark read, false = mark unread' },
      },
      required: ['id', 'read'],
    },
  },
]

export async function handle(name: string, args: Record<string, unknown>): Promise<ToolContent[]> {
  switch (name) {
    case 'list_contact_requests': {
      const { unreadOnly, limit } = args as { unreadOnly?: boolean; limit?: number }
      const requests = await prisma.contactRequest.findMany({
        where: unreadOnly ? { read: false } : {},
        orderBy: { createdAt: 'desc' },
        take: typeof limit === 'number' ? limit : 50,
      })
      return text(requests)
    }

    case 'mark_contact_read': {
      const { id, read } = args as { id: string; read: boolean }
      const req = await prisma.contactRequest.update({
        where: { id },
        data: { read },
      })
      return text(`Contact request marked as ${read ? 'read' : 'unread'}.\n${JSON.stringify(req, null, 2)}`)
    }

    default: throw new Error(`Unknown tool: ${name}`)
  }
}
