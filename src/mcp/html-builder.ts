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
 * Image (center): <img src="url" alt="…" style="width:75%;display:block;margin-left:auto;margin-right:auto;">
 * Image (left):   <img src="url" style="width:50%;float:left;margin-right:1em;margin-bottom:0.5em;display:block;">
 * Image (right):  <img src="url" style="width:50%;float:right;margin-left:1em;margin-bottom:0.5em;display:block;">
 * Video:          <video src="url" controls="" style="width:100%;…"><source src="url"></video>
 * Iframe:         <iframe src="url" height="400px" style="width:100%;…" frameborder="0"></iframe>
 * YouTube:        <div data-youtube-video><iframe src="https://www.youtube.com/embed/VIDEO_ID" allowfullscreen="true" frameborder="0"></iframe></div>
 * Bullet list:    <ul><li><p>item</p></li></ul>
 * Ordered list:   <ol><li><p>item</p></li></ol>
 * Blockquote:     <blockquote><p>text</p></blockquote>
 * Code block:     <pre><code class="language-js">...</code></pre>
 * Horizontal rule:<hr>
 * Table:          <table><thead><tr><th><p>H</p></th>…</tr></thead><tbody><tr><td><p>cell</p></td>…</tr></tbody></table>
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
  | { type: 'image'; src: string; alt?: string; width?: string; align?: 'left' | 'center' | 'right' }
  | { type: 'video'; src: string; width?: string; align?: 'left' | 'center' | 'right' }
  | { type: 'iframe'; src: string; width?: string; height?: string; align?: 'left' | 'center' | 'right'; allow?: string; allowfullscreen?: boolean }
  | { type: 'youtube'; src: string }
  | { type: 'table'; headers?: string[]; rows: string[][] }
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

// Matches the editor's mediaStyleStr — produces float or auto-margin layout
function mediaStyle(align: string | undefined, width: string): string {
  const w = width
  if (align === 'left')  return `width:${w};float:left;margin-right:1em;margin-bottom:0.5em;display:block;`
  if (align === 'right') return `width:${w};float:right;margin-left:1em;margin-bottom:0.5em;display:block;`
  return `width:${w};display:block;margin-left:auto;margin-right:auto;`
}

// Converts any YouTube URL variant to an embed URL
function toYoutubeEmbed(url: string): string {
  if (url.includes('youtube.com/embed/')) return url
  const short = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/)
  if (short) return `https://www.youtube.com/embed/${short[1]}`
  const watch = url.match(/[?&]v=([A-Za-z0-9_-]{11})/)
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`
  return url
}

function renderSpan(span: TextSpan): string {
  let html = escapeHtml(span.text)

  const styles: string[] = []
  if (span.color) styles.push(`color: ${span.color}`)
  if (span.backgroundColor) styles.push(`background-color: ${span.backgroundColor}`)
  if (span.fontFamily) styles.push(`font-family: ${span.fontFamily}`)
  if (span.fontSize) styles.push(`font-size: ${span.fontSize}`)

  if (styles.length > 0) {
    html = `<span style="${styles.join('; ')}">${html}</span>`
  }

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
      const style = mediaStyle(block.align, w)
      return `<img src="${escapeAttr(block.src)}" alt="${alt}" style="${style}">`
    }

    case 'video': {
      const w = block.width ?? '100%'
      const style = mediaStyle(block.align, w)
      const src = escapeAttr(block.src)
      return `<video src="${src}" controls="" style="${style}"><source src="${src}"></video>`
    }

    case 'iframe': {
      const w = block.width ?? '100%'
      const h = block.height ? (String(block.height).endsWith('px') ? block.height : `${block.height}px`) : '400px'
      const style = mediaStyle(block.align, w)
      let attrs = `src="${escapeAttr(block.src)}" height="${escapeAttr(h)}" style="${style}" frameborder="0"`
      if (block.allow) attrs += ` allow="${escapeAttr(block.allow)}"`
      if (block.allowfullscreen) attrs += ` allowfullscreen="true"`
      return `<iframe ${attrs}></iframe>`
    }

    case 'youtube': {
      const embedSrc = escapeAttr(toYoutubeEmbed(block.src))
      return `<div data-youtube-video><iframe src="${embedSrc}" allowfullscreen="true" frameborder="0"></iframe></div>`
    }

    case 'table': {
      const thead = block.headers
        ? `<thead><tr>${block.headers.map(h => `<th><p>${escapeHtml(h)}</p></th>`).join('')}</tr></thead>`
        : ''
      const tbody = `<tbody>${block.rows.map(row =>
        `<tr>${row.map(cell => `<td><p>${escapeHtml(cell)}</p></td>`).join('')}</tr>`
      ).join('')}</tbody>`
      return `<table>${thead}${tbody}</table>`
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
