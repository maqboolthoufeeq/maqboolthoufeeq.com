/**
 * Pure helpers for the Link Hub feature: the content-block type system, strict
 * per-type validation/sanitisation for everything an admin can store, a
 * dependency-free Markdown→HTML renderer, and an allow-listed embed parser.
 *
 * Everything here is a pure function (no DOM, no Prisma, no network) so it runs
 * unchanged on the server (API validation + SSR) and the client (live preview)
 * and is trivially unit-testable. The one security invariant: nothing leaves
 * this module that could inject script — URLs are http(s)-only, embeds are
 * rebuilt from scratch for known providers, and rendered HTML is always passed
 * through {@link sanitizePostHtml} by the caller before it reaches the DOM.
 */

import { isHttpUrl, parseYouTubeId, youTubeEmbedUrl } from './social'

/* ─── Content-block type system ──────────────────────────────────────────── */

export type HubItemType =
  | 'link'
  | 'text'
  | 'markdown'
  | 'richtext'
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'file'
  | 'embed'

export const HUB_ITEM_TYPES: HubItemType[] = [
  'link', 'text', 'markdown', 'richtext', 'image', 'video', 'audio', 'pdf', 'file', 'embed',
]

/** Human metadata for each block type — drives the admin "add block" picker. */
export const HUB_ITEM_META: Record<HubItemType, { label: string; hint: string; icon: string }> = {
  link:     { label: 'Link',      hint: 'A button that opens a URL in a new tab',        icon: 'Link' },
  text:     { label: 'Text',      hint: 'A short plain-text note',                       icon: 'Type' },
  markdown: { label: 'Markdown',  hint: 'Formatted text written in Markdown',            icon: 'Hash' },
  richtext: { label: 'Rich text', hint: 'Formatted text with the visual editor',         icon: 'FileText' },
  image:    { label: 'Image',     hint: 'Upload or link an image (incl. GIF animations)', icon: 'Image' },
  video:    { label: 'Video',     hint: 'Upload an MP4 or link a YouTube/Vimeo video',   icon: 'Video' },
  audio:    { label: 'Audio',     hint: 'Upload or link an audio file',                  icon: 'Music' },
  pdf:      { label: 'PDF',       hint: 'A PDF to preview inline and download',          icon: 'FileType' },
  file:     { label: 'File',      hint: 'Any downloadable file (docs, archives, …)',     icon: 'Download' },
  embed:    { label: 'Embed',     hint: 'Embed YouTube, Vimeo, Spotify, Figma, …',       icon: 'Code' },
}

export function isHubItemType(value: unknown): value is HubItemType {
  return typeof value === 'string' && (HUB_ITEM_TYPES as string[]).includes(value)
}

/** Defensive max lengths for every admin-supplied hub field (DoS-safe). */
export const HUB_LIMITS = {
  title: 200,
  description: 2000,
  content: 50_000,
  url: 2048,
  fileName: 200,
  topicTitle: 160,
  categoryName: 80,
  icon: 64,
  /** Max photos in one `image` block's gallery. */
  images: 20,
} as const

/* ─── Item input → sanitised, storable shape ─────────────────────────────── */

export interface HubItemInput {
  type: unknown
  title?: unknown
  description?: unknown
  url?: unknown
  fileUrl?: unknown
  fileName?: unknown
  fileSize?: unknown
  fileType?: unknown
  content?: unknown
  thumbnail?: unknown
  images?: unknown
}

/** One photo in an `image` block's gallery (uploaded blob or external http(s) link). */
export interface HubGalleryImage {
  url: string
  fileName: string | null
  fileSize: number | null
  fileType: string | null
}

/** The clean, JSON-serialisable payload persisted for a content block. */
export interface SanitizedHubItem {
  type: HubItemType
  title: string
  description: string | null
  url: string | null
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  fileType: string | null
  content: string | null
  thumbnail: string | null
  /** Always `[]` outside `image` blocks; 1+ entries for an `image` block's photos. */
  images: HubGalleryImage[]
}

export type SanitizeResult =
  | { ok: true; value: SanitizedHubItem }
  | { ok: false; error: string }

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function cap(v: string, max: number): string {
  return v.length > max ? v.slice(0, max) : v
}

/**
 * Normalise a typed URL: accept http(s) as-is, assume https:// when the scheme
 * is missing, and reject everything else (defusing javascript:/data: by
 * re-hosting). Returns null when the result still isn't a sane http(s) URL.
 */
export function normalizeHubUrl(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`
  return withScheme.length <= HUB_LIMITS.url && isHttpUrl(withScheme) ? withScheme : null
}

/** A strict http(s) check used for fields we never want to coerce (uploads). */
function cleanHttpUrl(raw: string): string | null {
  const value = raw.trim()
  if (!value || value.length > HUB_LIMITS.url || !isHttpUrl(value)) return null
  return value
}

/**
 * Validate + sanitise a single content block for storage. `richtextSanitizer`
 * is injected (the server passes `sanitizePostHtml`) so this module stays free
 * of the sanitize-html dependency and fully pure for the client preview.
 */
export function sanitizeHubItem(
  input: HubItemInput,
  richtextSanitizer: (html: string) => string = (h) => h,
): SanitizeResult {
  if (!isHubItemType(input.type)) return { ok: false, error: 'Unknown content type' }
  const type = input.type

  const title = cap(str(input.title).trim(), HUB_LIMITS.title)
  if (!title) return { ok: false, error: 'A title is required' }

  const description = cap(str(input.description).trim(), HUB_LIMITS.description) || null
  const thumbnail = input.thumbnail ? cleanHttpUrl(str(input.thumbnail)) : null

  const base: SanitizedHubItem = {
    type, title, description,
    url: null, fileUrl: null, fileName: null, fileSize: null, fileType: null,
    content: null, thumbnail, images: [],
  }

  switch (type) {
    case 'link': {
      const url = normalizeHubUrl(str(input.url))
      if (!url) return { ok: false, error: 'A valid http(s) link is required' }
      return { ok: true, value: { ...base, url } }
    }

    case 'text': {
      const content = cap(str(input.content).trim(), HUB_LIMITS.content)
      if (!content) return { ok: false, error: 'Text content is required' }
      return { ok: true, value: { ...base, content } }
    }

    case 'markdown': {
      const content = cap(str(input.content), HUB_LIMITS.content).trim()
      if (!content) return { ok: false, error: 'Markdown content is required' }
      return { ok: true, value: { ...base, content } }
    }

    case 'richtext': {
      const raw = cap(str(input.content), HUB_LIMITS.content)
      const content = richtextSanitizer(raw).trim()
      if (!content) return { ok: false, error: 'Rich-text content is required' }
      return { ok: true, value: { ...base, content } }
    }

    case 'image': {
      // A gallery of 1+ photos (uploaded blobs and/or external http(s) links).
      // Legacy single fileUrl/url inputs (no `images` array) become a 1-photo gallery.
      const fileName = cap(str(input.fileName).trim(), HUB_LIMITS.fileName) || null
      const fileSize = toSize(input.fileSize)
      const fileType = toMime(input.fileType)
      const gallery = sanitizeGalleryImages(input.images)
      if (gallery.length === 0) {
        const fileUrl = input.fileUrl ? cleanHttpUrl(str(input.fileUrl)) : null
        const url = input.url ? normalizeHubUrl(str(input.url)) : null
        if (fileUrl || url) gallery.push({ url: (fileUrl ?? url) as string, fileName, fileSize, fileType })
      }
      if (gallery.length === 0) {
        return { ok: false, error: 'Upload a file or paste a link for this image' }
      }
      const primary = gallery[0]
      return {
        ok: true,
        value: {
          ...base,
          fileUrl: primary.url,
          fileName: primary.fileName,
          fileSize: primary.fileSize,
          fileType: primary.fileType,
          images: gallery,
        },
      }
    }

    case 'video':
    case 'audio':
    case 'pdf': {
      // Either an uploaded blob URL or an external http(s) URL is acceptable.
      const fileUrl = input.fileUrl ? cleanHttpUrl(str(input.fileUrl)) : null
      const url = input.url ? normalizeHubUrl(str(input.url)) : null
      if (!fileUrl && !url) {
        return { ok: false, error: `Upload a file or paste a link for this ${type}` }
      }
      const fileName = cap(str(input.fileName).trim(), HUB_LIMITS.fileName) || null
      const fileSize = toSize(input.fileSize)
      const fileType = toMime(input.fileType)
      return { ok: true, value: { ...base, fileUrl, url, fileName, fileSize, fileType } }
    }

    case 'file': {
      const fileUrl = input.fileUrl ? cleanHttpUrl(str(input.fileUrl)) : null
      if (!fileUrl) return { ok: false, error: 'Upload a file to attach' }
      const fileName = cap(str(input.fileName).trim(), HUB_LIMITS.fileName) || null
      const fileSize = toSize(input.fileSize)
      const fileType = toMime(input.fileType)
      return { ok: true, value: { ...base, fileUrl, fileName, fileSize, fileType } }
    }

    case 'embed': {
      const url = normalizeHubUrl(str(input.url))
      if (!url) return { ok: false, error: 'A valid embed URL is required' }
      if (!parseHubEmbed(url)) {
        return { ok: false, error: 'That site can’t be embedded. Try YouTube, Vimeo, Spotify, SoundCloud, Loom, CodePen, Figma or Google Drive.' }
      }
      return { ok: true, value: { ...base, url } }
    }
  }
}

function toSize(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : null
}

function toMime(v: unknown): string | null {
  return typeof v === 'string' && v.length <= 100 ? v : null
}

/** Validate + sanitise an `image` block's gallery array, capped at HUB_LIMITS.images. */
function sanitizeGalleryImages(raw: unknown): HubGalleryImage[] {
  if (!Array.isArray(raw)) return []
  const out: HubGalleryImage[] = []
  for (const entry of raw) {
    if (out.length >= HUB_LIMITS.images) break
    if (!entry || typeof entry !== 'object') continue
    const e = entry as Record<string, unknown>
    const url = cleanHttpUrl(str(e.url)) ?? normalizeHubUrl(str(e.url))
    if (!url) continue
    out.push({
      url,
      fileName: cap(str(e.fileName).trim(), HUB_LIMITS.fileName) || null,
      fileSize: toSize(e.fileSize),
      fileType: toMime(e.fileType),
    })
  }
  return out
}

/* ─── Allow-listed embed parser ──────────────────────────────────────────── */

export type EmbedAspect = 'video' | 'square' | 'tall'

export interface HubEmbed {
  provider: string
  /** A safe iframe src we built ourselves — never the raw user input. */
  src: string
  aspect: EmbedAspect
  /** Whether the iframe needs allowfullscreen (video providers). */
  allowFullScreen: boolean
}

/**
 * Turn a pasted provider URL into a safe iframe source for a small allow-list of
 * well-known embed hosts. Returns null for anything not recognised — we never
 * render an arbitrary iframe, which is what keeps embeds XSS-safe.
 */
export function parseHubEmbed(rawUrl: string): HubEmbed | null {
  const url = rawUrl.trim()
  if (!url) return null

  let u: URL
  try {
    u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`)
  } catch {
    return null
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
  const host = u.hostname.replace(/^www\./, '').toLowerCase()

  // YouTube — reuse the hardened parser/embed-builder from lib/social.
  const yt = parseYouTubeId(url)
  if (yt && (host.endsWith('youtube.com') || host === 'youtu.be' || host === 'youtube-nocookie.com')) {
    return { provider: 'YouTube', src: youTubeEmbedUrl(yt), aspect: 'video', allowFullScreen: true }
  }

  // Vimeo — vimeo.com/{id} or player.vimeo.com/video/{id}
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = (u.pathname.match(/(\d{6,})/) ?? [])[1]
    if (id) return { provider: 'Vimeo', src: `https://player.vimeo.com/video/${id}`, aspect: 'video', allowFullScreen: true }
  }

  // Google Drive — file/d/{id} → /preview
  if (host === 'drive.google.com') {
    const id = (u.pathname.match(/\/d\/([^/]+)/) ?? [])[1]
    if (id && /^[\w-]{10,}$/.test(id)) {
      return { provider: 'Google Drive', src: `https://drive.google.com/file/d/${id}/preview`, aspect: 'video', allowFullScreen: true }
    }
  }

  // Spotify — open.spotify.com/{type}/{id} → /embed/{type}/{id}
  if (host === 'open.spotify.com') {
    const m = u.pathname.match(/^\/(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/)
    if (m) {
      const tall = m[1] === 'playlist' || m[1] === 'album' || m[1] === 'show'
      return { provider: 'Spotify', src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, aspect: tall ? 'tall' : 'square', allowFullScreen: false }
    }
  }

  // SoundCloud — wrap the track URL in the official player.
  if (host === 'soundcloud.com') {
    const clean = `https://soundcloud.com${u.pathname}`
    return { provider: 'SoundCloud', src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(clean)}&color=%23ff5500&visual=true`, aspect: 'square', allowFullScreen: false }
  }

  // Loom — loom.com/share/{id} → /embed/{id}
  if (host === 'loom.com') {
    const id = (u.pathname.match(/\/(?:share|embed)\/([\w-]+)/) ?? [])[1]
    if (id) return { provider: 'Loom', src: `https://www.loom.com/embed/${id}`, aspect: 'video', allowFullScreen: true }
  }

  // CodePen — codepen.io/{user}/pen/{id} or /team/{name}/pen/{id} → /embed/{id}
  if (host === 'codepen.io') {
    const m = u.pathname.match(/^\/(.+?)\/(?:pen|embed)\/([\w-]+)/)
    if (m) return { provider: 'CodePen', src: `https://codepen.io/${m[1]}/embed/${m[2]}?default-tab=result`, aspect: 'video', allowFullScreen: true }
  }

  // Figma — wrap file/proto URLs in the official embed.
  if (host === 'figma.com') {
    if (/^\/(file|proto|design|board)\//.test(u.pathname)) {
      return { provider: 'Figma', src: `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(`https://www.figma.com${u.pathname}${u.search}`)}`, aspect: 'video', allowFullScreen: true }
    }
  }

  // Google Maps — only accept an already-embeddable /maps/embed URL.
  if ((host === 'google.com' || host.endsWith('.google.com')) && u.pathname.startsWith('/maps/embed')) {
    return { provider: 'Google Maps', src: `https://www.google.com/maps/embed${u.search}`, aspect: 'video', allowFullScreen: false }
  }

  return null
}

/** Tailwind aspect class for an embed/media aspect. */
export function aspectClass(aspect: EmbedAspect): string {
  if (aspect === 'square') return 'aspect-square'
  if (aspect === 'tall') return 'aspect-[3/4]'
  return 'aspect-video'
}

/* ─── Dependency-free Markdown → HTML ────────────────────────────────────── */

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESCAPE_MAP[c])
}

/**
 * Private-use sentinel that brackets an extracted inline-code span while the
 * rest of the line is transformed. A private-use codepoint (U+E000) is not a
 * control character, never appears in real Markdown, and survives escapeHtml
 * untouched, so the code span can be restored verbatim afterwards.
 */
const CODE_MARK = ''
const CODE_MARK_RE = /(\d+)/g

/** Inline-level Markdown: code, bold, italic, strikethrough, links, images. */
function renderInline(text: string): string {
  // Pull out inline code spans first so their content isn't further formatted.
  const codes: string[] = []
  let out = text.replace(/`([^`]+)`/g, (_m, c) => {
    codes.push(`<code>${escapeHtml(c)}</code>`)
    return `${CODE_MARK}${codes.length - 1}${CODE_MARK}`
  })

  out = escapeHtml(out)

  // Images: ![alt](url) — only http(s) sources survive (sanitiser drops others).
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (_m, alt, url) => {
    const safe = normalizeHubUrl(url)
    return safe ? `<img src="${safe}" alt="${alt}" />` : ''
  })
  // Links: [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (_m, label, url) => {
    const safe = normalizeHubUrl(url)
    return safe ? `<a href="${safe}" target="_blank" rel="noopener noreferrer nofollow">${label}</a>` : label
  })
  // Bold, italic, strikethrough.
  out = out
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_\s][^_]*?)_/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')

  // Restore code spans.
  out = out.replace(CODE_MARK_RE, (_m, i) => codes[Number(i)] ?? '')
  return out
}

/**
 * Render a useful subset of Markdown to HTML. This is intentionally compact: its
 * output is ALWAYS passed through {@link sanitizePostHtml} before display, so
 * correctness (not safety) is the only concern here. Supports headings, bold/
 * italic/strike, inline + fenced code, links, images, blockquotes, ordered and
 * unordered lists, horizontal rules and paragraphs.
 */
export function markdownToHtml(md: string): string {
  const src = md.replace(/\r\n?/g, '\n')
  const lines = src.split('\n')
  const html: string[] = []

  let i = 0
  let inUl = false
  let inOl = false

  const closeLists = () => {
    if (inUl) { html.push('</ul>'); inUl = false }
    if (inOl) { html.push('</ol>'); inOl = false }
  }

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block.
    const fence = line.match(/^```(\w*)\s*$/)
    if (fence) {
      closeLists()
      const lang = fence[1]
      const buf: string[] = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i])) { buf.push(lines[i]); i++ }
      i++ // skip closing fence
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : ''
      html.push(`<pre><code${cls}>${escapeHtml(buf.join('\n'))}</code></pre>`)
      continue
    }

    // Blank line.
    if (/^\s*$/.test(line)) { closeLists(); i++; continue }

    // Horizontal rule.
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { closeLists(); html.push('<hr />'); i++; continue }

    // Heading.
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      closeLists()
      const level = h[1].length
      html.push(`<h${level}>${renderInline(h[2].trim())}</h${level}>`)
      i++
      continue
    }

    // Blockquote (consume consecutive quoted lines).
    if (/^\s*>\s?/.test(line)) {
      closeLists()
      const buf: string[] = []
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''))
        i++
      }
      html.push(`<blockquote>${renderInline(buf.join(' '))}</blockquote>`)
      continue
    }

    // Ordered list item.
    const ol = line.match(/^\s*\d+\.\s+(.*)$/)
    if (ol) {
      if (inUl) { html.push('</ul>'); inUl = false }
      if (!inOl) { html.push('<ol>'); inOl = true }
      html.push(`<li>${renderInline(ol[1].trim())}</li>`)
      i++
      continue
    }

    // Unordered list item.
    const ul = line.match(/^\s*[-*+]\s+(.*)$/)
    if (ul) {
      if (inOl) { html.push('</ol>'); inOl = false }
      if (!inUl) { html.push('<ul>'); inUl = true }
      html.push(`<li>${renderInline(ul[1].trim())}</li>`)
      i++
      continue
    }

    // Paragraph — gather until a blank line or a block-level starter.
    closeLists()
    const buf: string[] = [line.trim()]
    i++
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^(#{1,6}\s|```|\s*>|\s*[-*+]\s|\s*\d+\.\s)/.test(lines[i]) &&
      !/^\s*([-*_])(\s*\1){2,}\s*$/.test(lines[i])
    ) {
      buf.push(lines[i].trim())
      i++
    }
    html.push(`<p>${renderInline(buf.join('\n')).replace(/\n/g, '<br />')}</p>`)
  }

  closeLists()
  return html.join('\n')
}
