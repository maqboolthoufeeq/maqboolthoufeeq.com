import sanitizeHtml from 'sanitize-html'

/**
 * Server-side HTML sanitizer for rendered post content.
 *
 * Replaces the previous `isomorphic-dompurify` call, which dragged `jsdom` into
 * the server bundle — and jsdom's transitive `html-encoding-sniffer` →
 * `@exodus/bytes` (ESM) chain crashes Next.js's bundled `require()` in
 * production (ERR_REQUIRE_ESM), 500-ing every blog post for crawlers.
 *
 * `sanitize-html` is htmlparser2-based (no DOM/jsdom), so it runs cleanly in the
 * serverless runtime. The allow-list mirrors the old DOMPurify config so post
 * rendering is unchanged.
 */

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'hr',
  'video', 'source', 'iframe', 'div',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col',
]

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'src', 'alt', 'class',
  'controls', 'width', 'height', 'style',
  'frameborder', 'allowfullscreen', 'webkitallowfullscreen', 'mozallowfullscreen',
  'allow', 'id', 'name', 'data-youtube-video',
  'colspan', 'rowspan', 'scope',
]

export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { '*': ALLOWED_ATTR },
    // http/https for links + media; data: only for inline images.
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'], source: ['http', 'https', 'data'] },
    // Embeds (YouTube via TipTap, Google Drive) are author-controlled; allow any
    // iframe host, matching the prior behaviour. Inline styles are preserved
    // (TipTap emits them on tables/embeds) by not configuring allowedStyles.
    allowedIframeHostnames: undefined,
    allowProtocolRelative: false,
  })
}
