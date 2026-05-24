#!/usr/bin/env node
/**
 * Blog Editor MCP Server — stdio variant (local / development use)
 *
 * For production, use the hosted HTTP endpoint at https://yourdomain.com/mcp/
 * with the Claude Desktop remote MCP config:
 *   { "url": "https://yourdomain.com/mcp/",
 *     "headers": { "Authorization": "Bearer <token>" } }
 *
 * This stdio version is useful when running locally without exposing the app.
 *
 * Required env vars:
 *   BLOG_API_URL        — e.g. https://maqboolthoufeeq.com
 *   MCP_ACCESS_TOKEN    — Bearer token obtained via OAuth flow
 *
 * OAuth Setup (one-time):
 *   1. POST /api/oauth/clients  (admin session)
 *      { "name": "My MCP", "redirectUrls": ["http://localhost:3456/callback"] }
 *      → save clientId + clientSecret
 *   2. Open browser: GET /api/oauth/authorize?response_type=code&client_id=...&redirect_uri=...&state=xyz
 *   3. Approve consent → browser redirected to redirect_uri?code=...
 *   4. POST /api/oauth/token  { grant_type, code, client_id, client_secret, redirect_uri }
 *      → save access_token as MCP_ACCESS_TOKEN
 */

import { Server } from '@modelcontextprotocol/sdk/server'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio'
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types'

import { listPosts, getPost, createPost, updatePost, publishPost } from './tools/posts.js'
import { uploadImageFromUrl } from './tools/media.js'
import { blocksToHtml } from './html-builder.js'

// ─── Tool definitions ──────────────────────────────────────────────────────────

const BLOCK_SCHEMA = {
  type: 'array',
  description: `
Array of content blocks that are converted to Tiptap-compatible HTML.

BLOCK TYPES
───────────
{ "type": "paragraph", "content": [TextSpan, ...] }
{ "type": "heading",   "level": 2|3|4, "content": [TextSpan, ...] }
{ "type": "image",     "src": "url", "alt": "text", "width": "100%" }
{ "type": "bullet_list",  "items": [[TextSpan, ...], ...] }
{ "type": "ordered_list", "items": [[TextSpan, ...], ...] }
{ "type": "blockquote",   "content": [TextSpan, ...] }
{ "type": "code_block",   "code": "...", "language": "js" }
{ "type": "horizontal_rule" }

TEXTSPAN — inline formatting node
──────────────────────────────────
{
  "text":            "Hello world",   // required
  "bold":            true,            // <strong>
  "italic":          true,            // <em>
  "strikethrough":   true,            // <s>
  "code":            true,            // <code>
  "link":            "https://...",   // <a href>
  "color":           "#FF0000",       // text color  (CSS color value)
  "backgroundColor": "#FFFF00",       // highlight  (CSS color value)
  "fontFamily":      "Georgia, serif",// font family
  "fontSize":        "18px"           // font size   (CSS unit)
}

EXAMPLE — a paragraph with bold red text and a normal sentence:
[
  {
    "type": "paragraph",
    "content": [
      { "text": "Important: ", "bold": true, "color": "#e11d48" },
      { "text": "this is a normal sentence." }
    ]
  }
]
`.trim(),
  items: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['paragraph', 'heading', 'image', 'bullet_list', 'ordered_list', 'blockquote', 'code_block', 'horizontal_rule'],
      },
      level: { type: 'number', enum: [2, 3, 4] },
      content: { type: 'array', items: { type: 'object' } },
      items: { type: 'array', items: { type: 'array' } },
      src: { type: 'string' },
      alt: { type: 'string' },
      width: { type: 'string' },
      code: { type: 'string' },
      language: { type: 'string' },
    },
    required: ['type'],
  },
}

const TOOLS: Tool[] = [
  {
    name: 'list_posts',
    description:
      'List all blog posts with their id, title, slug, excerpt, published status, dates, and tags. ' +
      'Returns ALL posts (including drafts) by default. Set published=true to list only live posts.',
    inputSchema: {
      type: 'object',
      properties: {
        published: {
          type: 'boolean',
          description: 'When true, return only published posts. Omit to return all (including drafts).',
        },
      },
    },
  },
  {
    name: 'get_post',
    description:
      'Retrieve a single blog post by its ID, including the full HTML content. ' +
      'Use this before updating a post so you can see the current content.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Post ID (cuid).' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_post',
    description: `
Create a new blog post.

Provide content using EITHER:
  • blocks — structured array (recommended, see schema description)
  • content — raw Tiptap-compatible HTML string

EDITOR KNOWLEDGE
────────────────
The blog editor is Tiptap. Content is stored as HTML. The following HTML
elements and inline styles are fully supported:

  Bold:         <strong>text</strong>
  Italic:       <em>text</em>
  Strike:       <s>text</s>
  Inline code:  <code>text</code>
  Links:        <a href="https://...">anchor text</a>
  H2/H3/H4:    <h2>Title</h2>  <h3>Sub</h3>  <h4>Minor</h4>
  Paragraph:    <p>text</p>
  Bullet list:  <ul><li><p>item</p></li></ul>
  Ordered list: <ol><li><p>item</p></li></ol>
  Blockquote:   <blockquote><p>text</p></blockquote>
  Code block:   <pre><code class="language-ts">...</code></pre>
  Image:        <img src="url" alt="desc" style="width: 100%;">
  HR:           <hr>

INLINE STYLES (applied via <span style="...">):
  Text color:   style="color: #FF0000;"
  Background:   style="background-color: #FFFF00;"
  Font family:  style="font-family: Georgia, serif;"
  Font size:    style="font-size: 18px;"

Marks can be combined:
  <strong><span style="color: #e11d48;">bold red text</span></strong>
`.trim(),
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Post title. Used to auto-generate the URL slug.' },
        blocks: BLOCK_SCHEMA,
        content: {
          type: 'string',
          description: 'Raw Tiptap HTML. Use blocks instead when building content programmatically.',
        },
        excerpt: { type: 'string', description: 'Short summary shown in post cards and SEO description.' },
        coverImage: { type: 'string', description: 'URL to the featured/hero image for the post.' },
        published: { type: 'boolean', description: 'Publish immediately. Defaults to false (draft).' },
        tagIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of tag IDs to attach to this post.',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_post',
    description: `
Update an existing blog post. Only the fields you provide are changed.

You can update the content using blocks (structured) or content (raw HTML).
Fetch the post first with get_post to see the current content before modifying.

Supports the same HTML / inline-style formatting as create_post:
  Bold, italic, strikethrough, links, headings (h2-h4), lists, blockquotes,
  code blocks, images, horizontal rules.
  Color / font / size via inline styles on <span> elements.
`.trim(),
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID of the post to update.' },
        title: { type: 'string' },
        blocks: BLOCK_SCHEMA,
        content: { type: 'string', description: 'Raw Tiptap HTML replacement for the entire post body.' },
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
    description:
      'Publish or unpublish a blog post. ' +
      'Publishing sets publishedAt to now if it has not been set before. ' +
      'Unpublishing hides the post from public readers but preserves all content.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Post ID.' },
        published: { type: 'boolean', description: 'true to publish, false to unpublish.' },
      },
      required: ['id', 'published'],
    },
  },
  {
    name: 'upload_image_from_url',
    description:
      'Download a publicly accessible image and upload it to the blog media storage. ' +
      'Returns a permanent CDN URL you can use as the src in an image block or as coverImage. ' +
      'Supports JPEG, PNG, GIF, WebP, and SVG.',
    inputSchema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string', description: 'Public URL of the image to download and re-host.' },
      },
      required: ['imageUrl'],
    },
  },
  {
    name: 'build_html_content',
    description:
      'Preview helper: convert a blocks array to its Tiptap HTML string without saving anything. ' +
      'Useful for inspecting what the HTML will look like before passing it to create_post or update_post.',
    inputSchema: {
      type: 'object',
      properties: {
        blocks: BLOCK_SCHEMA,
      },
      required: ['blocks'],
    },
  },
]

// ─── Server setup ──────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'blog-editor', version: '1.0.0' },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

server.setRequestHandler(CallToolRequestSchema, async (req: CallToolRequest) => {
  const { name, arguments: args = {} } = req.params

  try {
    switch (name) {
      case 'list_posts': {
        const posts = await listPosts((args as { published?: boolean }).published)
        return { content: [{ type: 'text', text: JSON.stringify(posts, null, 2) }] }
      }

      case 'get_post': {
        const { id } = args as { id: string }
        const post = await getPost(id)
        return { content: [{ type: 'text', text: JSON.stringify(post, null, 2) }] }
      }

      case 'create_post': {
        const post = await createPost(args as Parameters<typeof createPost>[0])
        return {
          content: [
            {
              type: 'text',
              text: `Post created successfully.\n${JSON.stringify(post, null, 2)}`,
            },
          ],
        }
      }

      case 'update_post': {
        const { id, ...rest } = args as { id: string } & Parameters<typeof updatePost>[1]
        const post = await updatePost(id, rest)
        return {
          content: [
            {
              type: 'text',
              text: `Post updated successfully.\n${JSON.stringify(post, null, 2)}`,
            },
          ],
        }
      }

      case 'publish_post': {
        const { id, published } = args as { id: string; published: boolean }
        const post = await publishPost(id, published)
        const action = published ? 'published' : 'unpublished'
        return {
          content: [
            {
              type: 'text',
              text: `Post ${action} successfully.\n${JSON.stringify(post, null, 2)}`,
            },
          ],
        }
      }

      case 'upload_image_from_url': {
        const { imageUrl } = args as { imageUrl: string }
        const url = await uploadImageFromUrl(imageUrl)
        return {
          content: [
            {
              type: 'text',
              text: `Image uploaded successfully.\nCDN URL: ${url}`,
            },
          ],
        }
      }

      case 'build_html_content': {
        const { blocks } = args as { blocks: Parameters<typeof blocksToHtml>[0] }
        const html = blocksToHtml(blocks)
        return { content: [{ type: 'text', text: html }] }
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    }
  }
})

// ─── Start ─────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('[blog-mcp] Server running on stdio')
}

main().catch((err) => {
  console.error('[blog-mcp] Fatal:', err)
  process.exit(1)
})
