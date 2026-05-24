/**
 * Blog Editor MCP Server — hosted at /mcp
 *
 * Implements the MCP Streamable HTTP transport (stateless variant).
 * Authenticate every request with a Bearer token obtained via OAuth:
 *   Authorization: Bearer <access_token>
 *
 * Claude Desktop remote config:
 *   { "url": "https://yourdomain.com/mcp/",
 *     "headers": { "Authorization": "Bearer <token>" } }
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth-api'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import { uploadImage } from '@/lib/blob'
import { blocksToHtml, Block } from '@/src/mcp/html-builder'

// ─── MCP types ─────────────────────────────────────────────────────────────────

type JsonRpcRequest = {
  jsonrpc: '2.0'
  id?: string | number | null
  method: string
  params?: Record<string, unknown>
}

type ToolContent = { type: 'text'; text: string }

// ─── Tool definitions ──────────────────────────────────────────────────────────

const BLOCK_DESC = `
Array of content blocks converted to Tiptap HTML.
Block types: paragraph | heading (level 2-4) | image | bullet_list | ordered_list | blockquote | code_block | horizontal_rule
Each text block has a "content" array of TextSpan objects:
  { text, bold?, italic?, strikethrough?, code?, link?, color?, backgroundColor?, fontFamily?, fontSize? }
Example: [{"type":"heading","level":2,"content":[{"text":"Hello","bold":true,"color":"#e11d48"}]}]
`.trim()

const TOOLS = [
  {
    name: 'list_posts',
    description: 'List all blog posts (id, title, slug, excerpt, published, tags). Drafts included by default.',
    inputSchema: {
      type: 'object',
      properties: {
        published: { type: 'boolean', description: 'true = published posts only' },
      },
    },
  },
  {
    name: 'get_post',
    description: 'Fetch a single post by ID including full HTML content.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'create_post',
    description: `Create a blog post. Supply either blocks (structured) or content (raw HTML).
TIPTAP HTML REFERENCE — bold: <strong>, italic: <em>, strike: <s>, code: <code>,
link: <a href="">, headings: <h2>/<h3>/<h4>, lists: <ul>/<ol><li><p>,
blockquote: <blockquote><p>, code block: <pre><code class="language-js">,
image: <img src="" alt="" style="width:100%;">, hr: <hr>
Color/font via inline styles: <span style="color:#ff0000;font-family:Georgia;font-size:18px;">`,
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        blocks: { type: 'array', description: BLOCK_DESC, items: { type: 'object' } },
        content: { type: 'string', description: 'Raw Tiptap HTML (alternative to blocks)' },
        excerpt: { type: 'string' },
        coverImage: { type: 'string', description: 'URL to featured image' },
        published: { type: 'boolean' },
        tagIds: { type: 'array', items: { type: 'string' } },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_post',
    description: 'Update any fields of an existing post. Fetch the post first to see current content.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        blocks: { type: 'array', description: BLOCK_DESC, items: { type: 'object' } },
        content: { type: 'string' },
        excerpt: { type: 'string' },
        coverImage: { type: 'string' },
        published: { type: 'boolean' },
        tagIds: { type: 'array', items: { type: 'string' } },
      },
      required: ['id'],
    },
  },
  {
    name: 'publish_post',
    description: 'Publish or unpublish a post. Publishing sets publishedAt to now.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        published: { type: 'boolean' },
      },
      required: ['id', 'published'],
    },
  },
  {
    name: 'upload_image_from_url',
    description: 'Download a public image URL and re-upload to blog CDN. Returns the permanent CDN URL.',
    inputSchema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string', description: 'Publicly accessible image URL' },
      },
      required: ['imageUrl'],
    },
  },
  {
    name: 'build_html_content',
    description: 'Convert a blocks array to Tiptap HTML without saving. Use to preview content before creating/updating.',
    inputSchema: {
      type: 'object',
      properties: {
        blocks: { type: 'array', description: BLOCK_DESC, items: { type: 'object' } },
      },
      required: ['blocks'],
    },
  },
]

// ─── Tool handlers ─────────────────────────────────────────────────────────────

async function callTool(name: string, args: Record<string, unknown>): Promise<ToolContent[]> {
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
      return [{ type: 'text', text: JSON.stringify(posts, null, 2) }]
    }

    case 'get_post': {
      const { id } = args as { id: string }
      const post = await prisma.post.findUnique({ where: { id }, include: { tags: true } })
      if (!post) throw new Error(`Post not found: ${id}`)
      return [{ type: 'text', text: JSON.stringify(post, null, 2) }]
    }

    case 'create_post': {
      const { title, blocks, content, excerpt, coverImage, published, tagIds } =
        args as {
          title: string; blocks?: Block[]; content?: string; excerpt?: string
          coverImage?: string; published?: boolean; tagIds?: string[]
        }
      const html = blocks ? blocksToHtml(blocks) : (content ?? '')
      if (!html) throw new Error('Provide either blocks or content')

      const post = await prisma.post.create({
        data: {
          title,
          slug: slugify(title),
          content: html,
          excerpt: excerpt ?? null,
          coverImage: coverImage ?? null,
          published: Boolean(published),
          publishedAt: published ? new Date() : null,
          ...(tagIds?.length ? { tags: { connect: tagIds.map((id) => ({ id })) } } : {}),
        },
        include: { tags: true },
      })
      return [{ type: 'text', text: `Post created.\n${JSON.stringify(post, null, 2)}` }]
    }

    case 'update_post': {
      const { id, blocks, content, tagIds, ...rest } =
        args as {
          id: string; blocks?: Block[]; content?: string; tagIds?: string[]
          title?: string; excerpt?: string; coverImage?: string; published?: boolean
        }
      const body: Record<string, unknown> = { ...rest }
      if (blocks) body.content = blocksToHtml(blocks)
      else if (content !== undefined) body.content = content

      if (body.published === true) body.publishedAt = new Date()

      if (tagIds) {
        await prisma.post.update({ where: { id }, data: { tags: { set: [] } } })
      }
      const post = await prisma.post.update({
        where: { id },
        data: {
          ...body,
          ...(tagIds ? { tags: { connect: tagIds.map((tid) => ({ id: tid })) } } : {}),
        },
        include: { tags: true },
      })
      return [{ type: 'text', text: `Post updated.\n${JSON.stringify(post, null, 2)}` }]
    }

    case 'publish_post': {
      const { id, published } = args as { id: string; published: boolean }
      const post = await prisma.post.update({
        where: { id },
        data: { published, publishedAt: published ? new Date() : undefined },
        include: { tags: true },
      })
      return [{ type: 'text', text: `Post ${published ? 'published' : 'unpublished'}.\n${JSON.stringify(post, null, 2)}` }]
    }

    case 'upload_image_from_url': {
      const { imageUrl } = args as { imageUrl: string }
      const res = await fetch(imageUrl)
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)
      const contentType = res.headers.get('content-type') ?? 'image/jpeg'
      if (!contentType.startsWith('image/')) throw new Error(`Not an image: ${contentType}`)
      const blob = await res.blob()
      const ext = contentType.split('/')[1]?.split(';')[0] ?? 'jpg'
      const file = new File([blob], `mcp-upload-${Date.now()}.${ext}`, { type: contentType })
      const url = await uploadImage(file)
      return [{ type: 'text', text: `Uploaded. CDN URL: ${url}` }]
    }

    case 'build_html_content': {
      const { blocks } = args as { blocks: Block[] }
      return [{ type: 'text', text: blocksToHtml(blocks) }]
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

// ─── Route handlers ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: JsonRpcRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
      { status: 400 },
    )
  }

  const { id, method, params = {} } = body

  // Notifications have no id — acknowledge without a body
  if (id === undefined || id === null) {
    return new NextResponse(null, { status: 202 })
  }

  try {
    switch (method) {
      case 'initialize':
        return NextResponse.json({
          jsonrpc: '2.0', id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'blog-editor', version: '1.0.0' },
          },
        })

      case 'ping':
        return NextResponse.json({ jsonrpc: '2.0', id, result: {} })

      case 'tools/list':
        return NextResponse.json({ jsonrpc: '2.0', id, result: { tools: TOOLS } })

      case 'tools/call': {
        const { name: toolName, arguments: toolArgs = {} } =
          params as { name: string; arguments?: Record<string, unknown> }
        const content = await callTool(toolName, toolArgs)
        return NextResponse.json({ jsonrpc: '2.0', id, result: { content } })
      }

      default:
        return NextResponse.json({
          jsonrpc: '2.0', id,
          error: { code: -32601, message: `Method not found: ${method}` },
        })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({
      jsonrpc: '2.0', id,
      error: { code: -32000, message },
    })
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ name: 'blog-editor', version: '1.0.0', transport: 'http' })
}
