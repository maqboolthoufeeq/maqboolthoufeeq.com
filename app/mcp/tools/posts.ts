import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import { blocksToHtml, Block } from '@/src/mcp/html-builder'
import type { ToolDef, ToolContent } from '../types'
import { text } from '../types'

const BLOCK_SCHEMA = {
  type: 'array',
  description: `
Structured content blocks → Tiptap HTML. Block types:
  paragraph  { type, content: TextSpan[] }
  heading    { type, level: 2|3|4, content: TextSpan[] }
  image      { type, src, alt?, width? }
  bullet_list / ordered_list  { type, items: TextSpan[][] }
  blockquote { type, content: TextSpan[] }
  code_block { type, code, language? }
  horizontal_rule { type }

TextSpan: { text, bold?, italic?, strikethrough?, code?, link?,
            color?, backgroundColor?, fontFamily?, fontSize? }

TIPTAP HTML reference (for raw content strings):
  Bold: <strong>  Italic: <em>  Strike: <s>  Code: <code>
  Link: <a href="…">  Headings: <h2>/<h3>/<h4>
  Lists: <ul>/<ol><li><p>…</p></li>
  Blockquote: <blockquote><p>…</p></blockquote>
  Code block: <pre><code class="language-js">…</code></pre>
  Image: <img src="…" alt="…" style="width:100%;">
  Color/font: <span style="color:#ff0000;font-family:Georgia;font-size:18px;">
`.trim(),
  items: { type: 'object' },
}

export const TOOLS: ToolDef[] = [
  {
    name: 'list_posts',
    description: 'List all blog posts (id, title, slug, excerpt, published status, tags). Includes drafts by default.',
    inputSchema: {
      type: 'object',
      properties: {
        published: { type: 'boolean', description: 'true = published posts only' },
      },
    },
  },
  {
    name: 'get_post',
    description: 'Fetch a single blog post by ID including the full HTML content field.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Post cuid' } },
      required: ['id'],
    },
  },
  {
    name: 'create_post',
    description: 'Create a new blog post. Supply either blocks (structured) or content (raw Tiptap HTML).',
    inputSchema: {
      type: 'object',
      properties: {
        title:       { type: 'string', description: 'Post title — also used to generate the URL slug' },
        blocks:      BLOCK_SCHEMA,
        content:     { type: 'string', description: 'Raw Tiptap HTML (alternative to blocks)' },
        excerpt:     { type: 'string', description: 'Short summary for post cards and SEO' },
        coverImage:  { type: 'string', description: 'URL to the featured/hero image' },
        published:   { type: 'boolean', description: 'Publish immediately (default: false = draft)' },
        tagIds:      { type: 'array', items: { type: 'string' }, description: 'Tag IDs to attach' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_post',
    description: 'Update any fields of an existing blog post. Fetch the post first to see current content.',
    inputSchema: {
      type: 'object',
      properties: {
        id:          { type: 'string' },
        title:       { type: 'string' },
        blocks:      BLOCK_SCHEMA,
        content:     { type: 'string', description: 'Raw Tiptap HTML replacement for the full post body' },
        excerpt:     { type: 'string' },
        coverImage:  { type: 'string' },
        published:   { type: 'boolean' },
        tagIds:      { type: 'array', items: { type: 'string' } },
      },
      required: ['id'],
    },
  },
  {
    name: 'publish_post',
    description: 'Publish or unpublish a post. Publishing sets publishedAt to now if not already set.',
    inputSchema: {
      type: 'object',
      properties: {
        id:        { type: 'string' },
        published: { type: 'boolean' },
      },
      required: ['id', 'published'],
    },
  },
]

export async function handle(name: string, args: Record<string, unknown>): Promise<ToolContent[]> {
  switch (name) {
    case 'list_posts': {
      const publishedOnly = args.published === true
      const posts = await prisma.post.findMany({
        where: publishedOnly ? { published: true } : {},
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true, title: true, slug: true, excerpt: true, coverImage: true,
          published: true, publishedAt: true, createdAt: true,
          tags: { select: { id: true, name: true, slug: true } },
        },
      })
      return text(posts)
    }

    case 'get_post': {
      const { id } = args as { id: string }
      const post = await prisma.post.findUnique({ where: { id }, include: { tags: true } })
      if (!post) throw new Error(`Post not found: ${id}`)
      return text(post)
    }

    case 'create_post': {
      const { title, blocks, content, excerpt, coverImage, published, tagIds } =
        args as { title: string; blocks?: Block[]; content?: string; excerpt?: string
                  coverImage?: string; published?: boolean; tagIds?: string[] }
      const html = blocks ? blocksToHtml(blocks) : (content ?? '')
      if (!html) throw new Error('Provide either blocks or content')

      const post = await prisma.post.create({
        data: {
          title, slug: slugify(title), content: html,
          excerpt: excerpt ?? null, coverImage: coverImage ?? null,
          published: Boolean(published),
          publishedAt: published ? new Date() : null,
          ...(tagIds?.length ? { tags: { connect: tagIds.map((id) => ({ id })) } } : {}),
        },
        include: { tags: true },
      })
      return text(`Post created.\n${JSON.stringify(post, null, 2)}`)
    }

    case 'update_post': {
      const { id, blocks, content, tagIds, ...rest } =
        args as { id: string; blocks?: Block[]; content?: string; tagIds?: string[]
                  title?: string; excerpt?: string; coverImage?: string; published?: boolean }
      const body: Record<string, unknown> = { ...rest }
      if (blocks)             body.content = blocksToHtml(blocks)
      else if (content !== undefined) body.content = content
      if (body.published === true) body.publishedAt = new Date()

      if (tagIds) await prisma.post.update({ where: { id }, data: { tags: { set: [] } } })
      const post = await prisma.post.update({
        where: { id },
        data: { ...body, ...(tagIds ? { tags: { connect: tagIds.map((id) => ({ id })) } } : {}) },
        include: { tags: true },
      })
      return text(`Post updated.\n${JSON.stringify(post, null, 2)}`)
    }

    case 'publish_post': {
      const { id, published } = args as { id: string; published: boolean }
      const post = await prisma.post.update({
        where: { id },
        data: { published, publishedAt: published ? new Date() : undefined },
        include: { tags: true },
      })
      return text(`Post ${published ? 'published' : 'unpublished'}.\n${JSON.stringify(post, null, 2)}`)
    }

    default: throw new Error(`Unknown tool: ${name}`)
  }
}
