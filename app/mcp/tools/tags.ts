import { prisma } from '@/lib/prisma'
import type { ToolDef, ToolContent } from '../types'
import { text } from '../types'

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export const TOOLS: ToolDef[] = [
  {
    name: 'list_tags',
    description: 'List all tags with their IDs, slugs, and counts of attached posts/projects.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'create_tag',
    description: 'Create a new tag. The slug is auto-generated from the name.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Human-readable tag name, e.g. "TypeScript"' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_tag',
    description: 'Rename an existing tag.',
    inputSchema: {
      type: 'object',
      properties: {
        id:   { type: 'string' },
        name: { type: 'string' },
      },
      required: ['id', 'name'],
    },
  },
  {
    name: 'delete_tag',
    description: 'Delete a tag. It will be detached from all posts and projects.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
]

export async function handle(name: string, args: Record<string, unknown>): Promise<ToolContent[]> {
  switch (name) {
    case 'list_tags': {
      const tags = await prisma.tag.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { posts: true, projects: true } } },
      })
      return text(tags)
    }

    case 'create_tag': {
      const { name: tagName } = args as { name: string }
      if (!tagName?.trim()) throw new Error('name is required')
      const tag = await prisma.tag.create({
        data: { name: tagName.trim(), slug: slugify(tagName.trim()) },
      })
      return text(`Tag created.\n${JSON.stringify(tag, null, 2)}`)
    }

    case 'update_tag': {
      const { id, name: tagName } = args as { id: string; name: string }
      if (!tagName?.trim()) throw new Error('name is required')
      const tag = await prisma.tag.update({
        where: { id },
        data: { name: tagName.trim(), slug: slugify(tagName.trim()) },
      })
      return text(`Tag updated.\n${JSON.stringify(tag, null, 2)}`)
    }

    case 'delete_tag': {
      const { id } = args as { id: string }
      await prisma.tag.delete({ where: { id } })
      return text(`Tag ${id} deleted.`)
    }

    default: throw new Error(`Unknown tool: ${name}`)
  }
}

