import { uploadImage } from '@/lib/blob'
import { blocksToHtml, Block } from '@/src/mcp/html-builder'
import type { ToolDef, ToolContent } from '../types'
import { text } from '../types'

export const TOOLS: ToolDef[] = [
  {
    name: 'upload_image_from_url',
    description:
      'Download a publicly accessible image and re-upload it to the blog CDN. ' +
      'Returns a permanent CDN URL safe to use in coverImage, imageUrl, or inside post/project content. ' +
      'Supported formats: JPEG, PNG, WebP, GIF (max 5 MB).',
    inputSchema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string', description: 'Public URL of the source image' },
      },
      required: ['imageUrl'],
    },
  },
  {
    name: 'build_html_content',
    description:
      'Preview helper: convert a structured blocks array to Tiptap-compatible HTML without saving. ' +
      'Use this to inspect the generated HTML before passing it to create_post or update_post. ' +
      'Supports all editor block types: paragraph, heading, image, video, iframe, youtube, table, ' +
      'bullet_list, ordered_list, blockquote, code_block, horizontal_rule. ' +
      'Media blocks (image/video/iframe) accept width ("25%"–"100%") and align ("left"/"center"/"right"). ' +
      'YouTube block accepts any YouTube URL (watch/youtu.be/embed) and auto-converts to embed format. ' +
      'For Google Drive files, use an iframe block with the /preview URL: ' +
      'https://drive.google.com/file/d/{FILE_ID}/preview ' +
      'Table cells are plain text only — TextSpan marks are not supported inside table cells.',
    inputSchema: {
      type: 'object',
      properties: {
        blocks: {
          type: 'array',
          description: 'Array of content blocks — see create_post blocks schema for full type reference',
          items: { type: 'object' },
        },
      },
      required: ['blocks'],
    },
  },
]

export async function handle(name: string, args: Record<string, unknown>): Promise<ToolContent[]> {
  switch (name) {
    case 'upload_image_from_url': {
      const { imageUrl } = args as { imageUrl: string }
      const res = await fetch(imageUrl)
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${imageUrl}`)
      const contentType = res.headers.get('content-type') ?? 'image/jpeg'
      if (!contentType.startsWith('image/')) throw new Error(`URL is not an image: ${contentType}`)
      const blob = await res.blob()
      const ext = contentType.split('/')[1]?.split(';')[0] ?? 'jpg'
      const file = new File([blob], `mcp-${Date.now()}.${ext}`, { type: contentType })
      const url = await uploadImage(file)
      return text(`Image uploaded. CDN URL:\n${url}`)
    }

    case 'build_html_content': {
      const { blocks } = args as { blocks: Block[] }
      const html = blocksToHtml(blocks)
      return text(html)
    }

    default: throw new Error(`Unknown tool: ${name}`)
  }
}

