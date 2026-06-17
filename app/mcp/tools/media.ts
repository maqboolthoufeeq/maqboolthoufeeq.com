import { lookup } from 'dns/promises'
import { uploadImage } from '@/lib/blob'
import { blocksToHtml, Block } from '@/src/mcp/html-builder'
import type { ToolDef, ToolContent } from '../types'
import { text } from '../types'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

/** True for loopback / private / link-local / unique-local / cloud-metadata IPs. */
function isPrivateIp(ip: string): boolean {
  const v = ip.toLowerCase()
  return (
    /^127\./.test(v) ||
    /^10\./.test(v) ||
    /^192\.168\./.test(v) ||
    /^169\.254\./.test(v) || // link-local incl. 169.254.169.254 metadata
    /^172\.(1[6-9]|2\d|3[01])\./.test(v) ||
    v === '0.0.0.0' ||
    v === '::1' ||
    v.startsWith('fe80') || // IPv6 link-local
    v.startsWith('fc') || v.startsWith('fd') // IPv6 unique-local
  )
}

/**
 * SSRF guard for fetching a user-supplied URL: enforce http(s), then resolve the
 * hostname and reject if ANY resolved address is private/internal (also blocks
 * domains that deliberately point at internal IPs / cloud metadata).
 */
async function assertSafeImageUrl(raw: string): Promise<void> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('Invalid image URL')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http(s) image URLs are allowed')
  }
  const host = url.hostname.replace(/^\[|\]$/g, '') // strip IPv6 brackets
  let addrs: { address: string }[]
  try {
    addrs = await lookup(host, { all: true })
  } catch {
    throw new Error('Could not resolve image host')
  }
  if (addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address))) {
    throw new Error('Image URL resolves to a private or disallowed address')
  }
}

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
      if (!imageUrl || typeof imageUrl !== 'string') throw new Error('imageUrl is required')
      await assertSafeImageUrl(imageUrl)

      // No redirect following (a safe host could 30x to an internal one) and a hard timeout.
      const res = await fetch(imageUrl, { redirect: 'manual', signal: AbortSignal.timeout(10_000) })
      // Node's fetch surfaces a blocked redirect as an opaque response (status 0).
      if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
        throw new Error('Redirects are not allowed — provide a direct image URL')
      }
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)

      const contentType = res.headers.get('content-type') ?? 'image/jpeg'
      if (!contentType.startsWith('image/')) throw new Error(`URL is not an image: ${contentType}`)

      const declaredLen = Number(res.headers.get('content-length') ?? 0)
      if (declaredLen > MAX_IMAGE_BYTES) throw new Error('Image exceeds the 5 MB limit')
      const blob = await res.blob()
      if (blob.size > MAX_IMAGE_BYTES) throw new Error('Image exceeds the 5 MB limit')

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

