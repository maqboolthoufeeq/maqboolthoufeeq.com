import { prisma } from '@/lib/prisma'
import { THEMES, DEFAULT_THEME_ID } from '@/lib/themes'
import { DESIGNS, DEFAULT_DESIGN_ID } from '@/lib/designs'
import type { ToolDef, ToolContent } from '../types'
import { text } from '../types'

export const TOOLS: ToolDef[] = [
  {
    name: 'list_themes',
    description: 'List all available color themes with their IDs, names, and descriptions.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_active_theme',
    description: 'Get the currently active color theme.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'set_theme',
    description: `Set the site color theme. Available IDs: ${THEMES.map((t) => t.id).join(', ')}.`,
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          enum: THEMES.map((t) => t.id),
          description: 'Theme ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_designs',
    description: 'List all available card/UI design styles with their IDs and descriptions.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_active_design',
    description: 'Get the currently active UI design style.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'set_design',
    description: `Set the site UI design style. Available IDs: ${DESIGNS.map((d) => d.id).join(', ')}.`,
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          enum: DESIGNS.map((d) => d.id),
          description: 'Design ID',
        },
      },
      required: ['id'],
    },
  },
]

export async function handle(name: string, args: Record<string, unknown>): Promise<ToolContent[]> {
  switch (name) {
    case 'list_themes':
      return text(THEMES.map(({ id, name: n, description }) => ({ id, name: n, description })))

    case 'get_active_theme': {
      const row = await prisma.siteContent.findUnique({ where: { key: 'theme' } })
      const id = (row?.value as { id?: string } | null)?.id ?? DEFAULT_THEME_ID
      const theme = THEMES.find((t) => t.id === id)
      return text({ active: id, theme })
    }

    case 'set_theme': {
      const { id } = args as { id: string }
      if (!THEMES.find((t) => t.id === id)) throw new Error(`Unknown theme: ${id}`)
      await prisma.siteContent.upsert({
        where: { key: 'theme' },
        update: { value: { id } },
        create: { key: 'theme', value: { id } },
      })
      return text(`Theme set to "${id}".`)
    }

    case 'list_designs':
      return text(DESIGNS.map(({ id, name: n, description }) => ({ id, name: n, description })))

    case 'get_active_design': {
      const row = await prisma.siteContent.findUnique({ where: { key: 'design' } })
      const id = (row?.value as { id?: string } | null)?.id ?? DEFAULT_DESIGN_ID
      const design = DESIGNS.find((d) => d.id === id)
      return text({ active: id, design })
    }

    case 'set_design': {
      const { id } = args as { id: string }
      if (!DESIGNS.find((d) => d.id === id)) throw new Error(`Unknown design: ${id}`)
      await prisma.siteContent.upsert({
        where: { key: 'design' },
        update: { value: { id } },
        create: { key: 'design', value: { id } },
      })
      return text(`Design set to "${id}".`)
    }

    default: throw new Error(`Unknown tool: ${name}`)
  }
}

