import { prisma } from '@/lib/prisma'
import type { ToolDef, ToolContent } from '../types'
import { text } from '../types'

export const TOOLS: ToolDef[] = [
  {
    name: 'list_projects',
    description: 'List all portfolio projects ordered by their display order, including tags.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_project',
    description: 'Fetch a single project by ID.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'create_project',
    description: 'Create a new portfolio project.',
    inputSchema: {
      type: 'object',
      properties: {
        title:       { type: 'string', description: 'Project name' },
        description: { type: 'string', description: 'Project description (supports plain text)' },
        tech:        { type: 'array', items: { type: 'string' }, description: 'Tech stack labels, e.g. ["React","Node.js"]' },
        liveUrl:     { type: 'string', description: 'Link to the live project' },
        repoUrl:     { type: 'string', description: 'Link to the source repository' },
        imageUrl:    { type: 'string', description: 'Primary/hero image URL (use upload_image_from_url to host it)' },
        images:      { type: 'array', items: { type: 'string' }, description: 'Additional image URLs for gallery' },
        order:       { type: 'number', description: 'Display order (lower = shown first)' },
        featured:    { type: 'boolean', description: 'Feature this project prominently' },
        tagIds:      { type: 'array', items: { type: 'string' }, description: 'Tag IDs to attach' },
      },
      required: ['title', 'description'],
    },
  },
  {
    name: 'update_project',
    description: 'Update any fields of an existing project.',
    inputSchema: {
      type: 'object',
      properties: {
        id:          { type: 'string' },
        title:       { type: 'string' },
        description: { type: 'string' },
        tech:        { type: 'array', items: { type: 'string' } },
        liveUrl:     { type: 'string' },
        repoUrl:     { type: 'string' },
        imageUrl:    { type: 'string' },
        images:      { type: 'array', items: { type: 'string' } },
        order:       { type: 'number' },
        featured:    { type: 'boolean' },
        tagIds:      { type: 'array', items: { type: 'string' } },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_project',
    description: 'Permanently delete a project.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'reorder_projects',
    description: 'Set the display order for multiple projects at once.',
    inputSchema: {
      type: 'object',
      properties: {
        order: {
          type: 'array',
          description: 'Array of { id, order } pairs',
          items: {
            type: 'object',
            properties: {
              id:    { type: 'string' },
              order: { type: 'number' },
            },
            required: ['id', 'order'],
          },
        },
      },
      required: ['order'],
    },
  },
]

export async function handle(name: string, args: Record<string, unknown>): Promise<ToolContent[]> {
  switch (name) {
    case 'list_projects': {
      const projects = await prisma.project.findMany({
        orderBy: { order: 'asc' },
        include: { tags: { select: { id: true, name: true, slug: true } } },
      })
      return text(projects)
    }

    case 'get_project': {
      const { id } = args as { id: string }
      const project = await prisma.project.findUnique({ where: { id }, include: { tags: true } })
      if (!project) throw new Error(`Project not found: ${id}`)
      return text(project)
    }

    case 'create_project': {
      const { title, description, tech, liveUrl, repoUrl, imageUrl, images, order, featured, tagIds } =
        args as {
          title: string; description: string; tech?: string[]; liveUrl?: string
          repoUrl?: string; imageUrl?: string; images?: string[]; order?: number
          featured?: boolean; tagIds?: string[]
        }
      const project = await prisma.project.create({
        data: {
          title, description,
          tech:     Array.isArray(tech) ? tech : [],
          liveUrl:  liveUrl ?? null,
          repoUrl:  repoUrl ?? null,
          imageUrl: imageUrl ?? null,
          images:   Array.isArray(images) ? images : [],
          order:    typeof order === 'number' ? order : 0,
          featured: Boolean(featured),
          ...(tagIds?.length ? { tags: { connect: tagIds.map((id) => ({ id })) } } : {}),
        },
        include: { tags: true },
      })
      return text(`Project created.\n${JSON.stringify(project, null, 2)}`)
    }

    case 'update_project': {
      const { id, tech, images, tagIds, liveUrl, repoUrl, imageUrl, ...rest } =
        args as {
          id: string; tech?: string[]; images?: string[]; tagIds?: string[]
          liveUrl?: string; repoUrl?: string; imageUrl?: string
          title?: string; description?: string; order?: number; featured?: boolean
        }
      const project = await prisma.project.update({
        where: { id },
        data: {
          ...rest,
          ...(tech      !== undefined && { tech:     Array.isArray(tech) ? tech : [] }),
          ...(images    !== undefined && { images:   Array.isArray(images) ? images : [] }),
          ...(liveUrl   !== undefined && { liveUrl:  liveUrl ?? null }),
          ...(repoUrl   !== undefined && { repoUrl:  repoUrl ?? null }),
          ...(imageUrl  !== undefined && { imageUrl: imageUrl ?? null }),
          ...(tagIds && { tags: { set: tagIds.map((tid) => ({ id: tid })) } }),
        },
        include: { tags: true },
      })
      return text(`Project updated.\n${JSON.stringify(project, null, 2)}`)
    }

    case 'delete_project': {
      const { id } = args as { id: string }
      await prisma.project.delete({ where: { id } })
      return text(`Project ${id} deleted.`)
    }

    case 'reorder_projects': {
      const { order } = args as { order: Array<{ id: string; order: number }> }
      await Promise.all(
        order.map(({ id, order: o }) => prisma.project.update({ where: { id }, data: { order: o } })),
      )
      return text(`Reordered ${order.length} projects.`)
    }

    default: throw new Error(`Unknown tool: ${name}`)
  }
}

