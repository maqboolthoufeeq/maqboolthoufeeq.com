/**
 * HTML builder for the Tiptap-based blog editor.
 *
 * The blog stores content as HTML. This module converts structured block
 * descriptions into the exact HTML that Tiptap produces/consumes.
 *
 * TIPTAP HTML REFERENCE
 * ─────────────────────
 * Paragraphs:     <p>...</p>
 * Headings:       <h2>..</h2>  <h3>..</h3>  <h4>..</h4>
 * Bold:           <strong>text</strong>
 * Italic:         <em>text</em>
 * Strikethrough:  <s>text</s>
 * Inline code:    <code>text</code>
 * Links:          <a href="url">text</a>
 * Text color:     <span style="color: #hexOrRgb;">text</span>
 * Background:     <span style="background-color: #hex;">text</span>
 * Font family:    <span style="font-family: Georgia, serif;">text</span>
 * Font size:      <span style="font-size: 18px;">text</span>
 * Images:         <img src="url" alt="alt text" style="width: 100%;">
 * Bullet list:    <ul><li><p>item</p></li></ul>
 * Ordered list:   <ol><li><p>item</p></li></ol>
 * Blockquote:     <blockquote><p>text</p></blockquote>
 * Code block:     <pre><code class="language-js">...</code></pre>
 * Horizontal rule:<hr>
 *
 * Multiple marks can be combined; e.g. bold + red text:
 *   <strong><span style="color: #ff0000;">text</span></strong>
 */

export type TextSpan = {
  text: string
  bold?: boolean
  italic?: boolean
  strikethrough?: boolean
  code?: boolean
  link?: string
  color?: string
  backgroundColor?: string
  fontFamily?: string
  fontSize?: string
}

export type Block =
  | { type: 'paragraph'; content: TextSpan[] }
  | { type: 'heading'; level: 2 | 3 | 4; content: TextSpan[] }
  | { type: 'image'; src: string; alt?: string; width?: string }
  | { type: 'bullet_list'; items: TextSpan[][] }
  | { type: 'ordered_list'; items: TextSpan[][] }
  | { type: 'blockquote'; content: TextSpan[] }
  | { type: 'code_block'; code: string; language?: string }
  | { type: 'horizontal_rule' }

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function renderSpan(span: TextSpan): string {
  let html = escapeHtml(span.text)

  // Inline styles wrap the raw text first
  const styles: string[] = []
  if (span.color) styles.push(`color: ${span.color}`)
  if (span.backgroundColor) styles.push(`background-color: ${span.backgroundColor}`)
  if (span.fontFamily) styles.push(`font-family: ${span.fontFamily}`)
  if (span.fontSize) styles.push(`font-size: ${span.fontSize}`)

  if (styles.length > 0) {
    html = `<span style="${styles.join('; ')}">${html}</span>`
  }

  // Marks applied outside styles (innermost first)
  if (span.code) html = `<code>${html}</code>`
  if (span.bold) html = `<strong>${html}</strong>`
  if (span.italic) html = `<em>${html}</em>`
  if (span.strikethrough) html = `<s>${html}</s>`
  if (span.link) html = `<a href="${escapeAttr(span.link)}">${html}</a>`

  return html
}

function renderSpans(spans: TextSpan[]): string {
  return spans.map(renderSpan).join('')
}

function renderBlock(block: Block): string {
  switch (block.type) {
    case 'paragraph':
      return `<p>${renderSpans(block.content)}</p>`

    case 'heading':
      return `<h${block.level}>${renderSpans(block.content)}</h${block.level}>`

    case 'image': {
      const w = block.width ?? '100%'
      const alt = escapeAttr(block.alt ?? '')
      return `<img src="${escapeAttr(block.src)}" alt="${alt}" style="width: ${w};">`
    }

    case 'bullet_list': {
      const items = block.items
        .map((spans) => `<li><p>${renderSpans(spans)}</p></li>`)
        .join('')
      return `<ul>${items}</ul>`
    }

    case 'ordered_list': {
      const items = block.items
        .map((spans) => `<li><p>${renderSpans(spans)}</p></li>`)
        .join('')
      return `<ol>${items}</ol>`
    }

    case 'blockquote':
      return `<blockquote><p>${renderSpans(block.content)}</p></blockquote>`

    case 'code_block': {
      const lang = block.language ? ` class="language-${block.language}"` : ''
      return `<pre><code${lang}>${escapeHtml(block.code)}</code></pre>`
    }

    case 'horizontal_rule':
      return `<hr>`
  }
}

/** Convert an array of structured blocks to Tiptap-compatible HTML. */
export function blocksToHtml(blocks: Block[]): string {
  return blocks.map(renderBlock).join('\n')
}
