/**
 * A focused HTML → Markdown converter for cross-posting blog articles to markdown
 * platforms (dev.to, Hashnode). Blog content is stored as sanitized TipTap HTML, but
 * those APIs want Markdown, so we convert here.
 *
 * Scope is deliberately narrow: the tags TipTap's StarterKit + the extensions in use
 * actually emit (headings, paragraphs, bold/italic/strike, inline code, code blocks,
 * links, images, lists, blockquotes, tables, hr, br). It runs server-side in Node where
 * there is no DOMParser, so it uses a small, well-formed-HTML tokenizer + tree walk
 * rather than a browser DOM. Not a general-purpose HTML parser — it assumes the clean,
 * balanced markup our sanitizer guarantees.
 */

const MAX_INPUT = 500_000 // defensive cap; blog posts are far smaller

type TextNode = { type: 'text'; value: string }
type ElementNode = { type: 'element'; tag: string; attrs: Record<string, string>; children: Node[] }
type Node = TextNode | ElementNode

const VOID_TAGS = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source'])
const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…',
}

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body: string) => {
    if (body[0] === '#') {
      const codePoint = body[1] === 'x' || body[1] === 'X'
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10)
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : whole
    }
    const mapped = ENTITIES[body.toLowerCase()]
    return mapped ?? whole
  })
}

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g
  for (const m of raw.matchAll(re)) {
    const key = m[1].toLowerCase()
    const value = m[2] ?? m[3] ?? m[4] ?? ''
    attrs[key] = decodeEntities(value)
  }
  return attrs
}

/** Tokenize + build a shallow DOM tree from well-formed HTML. */
function parse(html: string): Node[] {
  const root: ElementNode = { type: 'element', tag: '#root', attrs: {}, children: [] }
  const stack: ElementNode[] = [root]
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*?)\/?>/g
  let last = 0

  const pushText = (text: string) => {
    if (!text) return
    stack[stack.length - 1].children.push({ type: 'text', value: decodeEntities(text) })
  }

  for (const m of html.matchAll(tagRe)) {
    const start = m.index ?? 0
    pushText(html.slice(last, start))
    last = start + m[0].length

    const tag = m[1].toLowerCase()
    const isClose = m[0][1] === '/'
    const selfClose = m[0].endsWith('/>') || VOID_TAGS.has(tag)

    if (isClose) {
      // Pop up to the matching open tag (tolerant of minor imbalance).
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) {
          stack.length = i
          break
        }
      }
      continue
    }

    const el: ElementNode = { type: 'element', tag, attrs: parseAttrs(m[2] ?? ''), children: [] }
    stack[stack.length - 1].children.push(el)
    if (!selfClose) stack.push(el)
  }
  pushText(html.slice(last))
  return root.children
}

const escapeInline = (text: string) => text.replace(/([\\`*_[\]])/g, '\\$1')
const rawText = (nodes: Node[]): string => nodes.map((c) => (c.type === 'text' ? c.value : rawText(c.children))).join('')

function renderInline(nodes: Node[]): string {
  let out = ''
  for (const node of nodes) {
    if (node.type === 'text') {
      out += escapeInline(node.value.replace(/\s+/g, ' '))
      continue
    }
    const inner = renderInline(node.children)
    switch (node.tag) {
      case 'strong':
      case 'b':
        out += `**${inner}**`
        break
      case 'em':
      case 'i':
        out += `*${inner}*`
        break
      case 's':
      case 'del':
      case 'strike':
        out += `~~${inner}~~`
        break
      case 'code':
        out += `\`${rawText(node.children)}\``
        break
      case 'a': {
        const href = node.attrs.href ?? ''
        out += href ? `[${inner || href}](${href})` : inner
        break
      }
      case 'img': {
        const src = node.attrs.src ?? ''
        if (src) out += `![${node.attrs.alt ?? ''}](${src})`
        break
      }
      case 'br':
        out += '  \n'
        break
      default:
        out += inner
    }
  }
  return out
}

function renderBlocks(nodes: Node[], depth = 0): string {
  const parts: string[] = []
  for (const node of nodes) {
    if (node.type === 'text') {
      const t = node.value.trim()
      if (t) parts.push(escapeInline(t))
      continue
    }
    parts.push(renderBlock(node, depth))
  }
  return parts.filter((p) => p.length > 0).join('\n\n')
}

function renderBlock(node: ElementNode, depth: number): string {
  switch (node.tag) {
    case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': {
      const level = Number(node.tag[1])
      return `${'#'.repeat(level)} ${renderInline(node.children).trim()}`
    }
    case 'p':
      return renderInline(node.children).trim()
    case 'hr':
      return '---'
    case 'blockquote':
      return renderBlocks(node.children, depth)
        .split('\n')
        .map((line) => (line ? `> ${line}` : '>'))
        .join('\n')
    case 'pre': {
      const codeEl = node.children.find((c): c is ElementNode => c.type === 'element' && c.tag === 'code')
      const target = codeEl ?? node
      const lang = (codeEl?.attrs.class ?? '').match(/language-([\w-]+)/)?.[1] ?? ''
      const code = rawText(target.children)
      return `\`\`\`${lang}\n${code.replace(/\n$/, '')}\n\`\`\``
    }
    case 'ul':
    case 'ol':
      return renderList(node, depth)
    case 'table':
      return renderTable(node)
    case 'figure':
    case 'div':
    case 'section':
      return renderBlocks(node.children, depth)
    default:
      // Inline-level element appearing at block level — render inline.
      return renderInline([node]).trim()
  }
}

function renderList(list: ElementNode, depth: number): string {
  const ordered = list.tag === 'ol'
  const indent = '  '.repeat(depth)
  const items = list.children.filter((c): c is ElementNode => c.type === 'element' && c.tag === 'li')
  return items
    .map((li, i) => {
      const marker = ordered ? `${i + 1}.` : '-'
      const nested = li.children.filter((c): c is ElementNode => c.type === 'element' && (c.tag === 'ul' || c.tag === 'ol'))
      const own = li.children.filter((c) => !(c.type === 'element' && (c.tag === 'ul' || c.tag === 'ol')))
      const text = renderInline(own).trim()
      let block = `${indent}${marker} ${text}`
      for (const sub of nested) block += `\n${renderList(sub, depth + 1)}`
      return block
    })
    .join('\n')
}

function renderTable(table: ElementNode): string {
  const rows: ElementNode[] = []
  const collect = (n: ElementNode) => {
    for (const c of n.children) {
      if (c.type !== 'element') continue
      if (c.tag === 'tr') rows.push(c)
      else if (['thead', 'tbody', 'tfoot'].includes(c.tag)) collect(c)
    }
  }
  collect(table)
  if (rows.length === 0) return ''

  const cellText = (row: ElementNode) =>
    row.children
      .filter((c): c is ElementNode => c.type === 'element' && (c.tag === 'td' || c.tag === 'th'))
      .map((c) => renderInline(c.children).trim().replace(/\|/g, '\\|') || ' ')

  const header = cellText(rows[0])
  const lines = [`| ${header.join(' | ')} |`, `| ${header.map(() => '---').join(' | ')} |`]
  for (const row of rows.slice(1)) lines.push(`| ${cellText(row).join(' | ')} |`)
  return lines.join('\n')
}

/** Convert sanitized TipTap HTML to Markdown. */
export function htmlToMarkdown(html: string): string {
  if (!html) return ''
  const safe = html.length > MAX_INPUT ? html.slice(0, MAX_INPUT) : html
  return renderBlocks(parse(safe))
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Strip all tags to a single-line-ish plain-text summary (for announce providers). */
export function htmlToPlainText(html: string): string {
  if (!html) return ''
  const walk = (nodes: Node[]): string =>
    nodes
      .map((n) => (n.type === 'text' ? n.value : (n.tag === 'br' ? ' ' : walk(n.children) + ' ')))
      .join('')
  return walk(parse(html)).replace(/\s+/g, ' ').trim()
}

/** Trim text to `max` characters on a word boundary, adding an ellipsis. */
export function truncate(text: string, max: number): string {
  const t = text.trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}
