import { lookup } from 'node:dns/promises'
import { request as httpsRequest } from 'node:https'
import { request as httpRequest, type IncomingMessage } from 'node:http'
import { isIP } from 'node:net'
import ipaddr from 'ipaddr.js'
import { uploadImage } from '@/lib/blob'
import { blocksToHtml, Block } from '@/src/mcp/html-builder'
import type { ToolDef, ToolContent } from '../types'
import { text } from '../types'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB
const FETCH_TIMEOUT_MS = 10_000

/**
 * Public-internet unicast addresses only. Uses ipaddr.js so EVERY IP form is
 * classified correctly — IPv4, IPv6, fully-expanded IPv6, and IPv4-mapped IPv6
 * (`::ffff:127.0.0.1`) — unwrapping mapped addresses before the range check. Any
 * range other than `unicast` (loopback, private, link-local incl. cloud metadata
 * 169.254.169.254, unique-local, CGNAT, reserved, …) is rejected. Unparseable
 * input fails closed.
 */
function isPublicIp(ip: string): boolean {
  let addr: ipaddr.IPv4 | ipaddr.IPv6
  try {
    addr = ipaddr.parse(ip)
  } catch {
    return false
  }
  if (addr.kind() === 'ipv6') {
    const v6 = addr as ipaddr.IPv6
    if (v6.isIPv4MappedAddress()) addr = v6.toIPv4Address()
  }
  return addr.range() === 'unicast'
}

/**
 * SSRF-safe image download for a user-supplied URL. Enforces http(s), resolves
 * the host and rejects unless EVERY resolved address is public, then PINS the
 * connection to a validated IP (passed as the connect host, with the original
 * Host header + TLS SNI preserved) so the socket can never be re-resolved to an
 * internal address between the check and the request — closing the classic DNS
 * rebinding TOCTOU. Redirects are refused; size and time are capped.
 */
async function downloadImageSafely(rawUrl: string): Promise<{ buffer: Buffer; contentType: string }> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error('Invalid image URL')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http(s) image URLs are allowed')
  }

  const host = url.hostname.replace(/^\[|\]$/g, '') // strip IPv6 brackets
  let candidates: string[]
  if (isIP(host)) {
    candidates = [host]
  } else {
    const addrs = await lookup(host, { all: true }).catch(() => [] as { address: string }[])
    candidates = addrs.map((a) => a.address)
  }
  if (candidates.length === 0) throw new Error('Could not resolve image host')
  if (!candidates.every(isPublicIp)) {
    throw new Error('Image URL resolves to a private or disallowed address')
  }
  const pinnedIp = candidates[0]

  const isHttps = url.protocol === 'https:'
  const options = {
    host: pinnedIp, // connect to the validated IP — never re-resolved (anti-rebinding)
    port: Number(url.port) || (isHttps ? 443 : 80),
    path: `${url.pathname}${url.search}`,
    method: 'GET' as const,
    // Identity encoding: node:http does not auto-decompress, so refuse gzip/br to
    // avoid storing compressed bytes as an image.
    headers: { Host: host, 'User-Agent': 'maqboolthoufeeq-mcp/1.0', Accept: 'image/*', 'Accept-Encoding': 'identity' },
    timeout: FETCH_TIMEOUT_MS,
  }

  return await new Promise<{ buffer: Buffer; contentType: string }>((resolve, reject) => {
    const onResponse = (res: IncomingMessage) => {
      const status = res.statusCode ?? 0
      if (status >= 300 && status < 400) {
        res.destroy()
        return reject(new Error('Redirects are not allowed — provide a direct image URL'))
      }
      if (status < 200 || status >= 300) {
        res.destroy()
        return reject(new Error(`Failed to fetch image: ${status}`))
      }
      const ctHeader = res.headers['content-type']
      const contentType = (Array.isArray(ctHeader) ? ctHeader[0] : ctHeader ?? 'image/jpeg')
        .split(';')[0]
        .trim()
      if (!contentType.startsWith('image/')) {
        res.destroy()
        return reject(new Error(`URL is not an image: ${contentType}`))
      }
      if (Number(res.headers['content-length'] ?? 0) > MAX_IMAGE_BYTES) {
        res.destroy()
        return reject(new Error('Image exceeds the 5 MB limit'))
      }
      const chunks: Buffer[] = []
      let size = 0
      res.on('data', (chunk: Buffer) => {
        size += chunk.length
        if (size > MAX_IMAGE_BYTES) {
          res.destroy()
          reject(new Error('Image exceeds the 5 MB limit'))
          return
        }
        chunks.push(chunk)
      })
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType }))
      res.on('error', reject)
    }

    const req = isHttps
      ? httpsRequest({ ...options, servername: host }, onResponse)
      : httpRequest(options, onResponse)
    req.on('timeout', () => req.destroy(new Error('Image fetch timed out')))
    req.on('error', reject)
    req.end()
  })
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

      const { buffer, contentType } = await downloadImageSafely(imageUrl)
      const ext = contentType.split('/')[1] ?? 'jpg'
      const file = new File([new Uint8Array(buffer)], `mcp-${Date.now()}.${ext}`, { type: contentType })
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

