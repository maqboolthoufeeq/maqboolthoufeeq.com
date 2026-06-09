import {
  isHubItemType,
  normalizeHubUrl,
  sanitizeHubItem,
  parseHubEmbed,
  markdownToHtml,
  HUB_LIMITS,
} from '@/lib/hub-content'

describe('isHubItemType', () => {
  it('accepts known types and rejects others', () => {
    expect(isHubItemType('link')).toBe(true)
    expect(isHubItemType('embed')).toBe(true)
    expect(isHubItemType('script')).toBe(false)
    expect(isHubItemType(42)).toBe(false)
  })
})

describe('normalizeHubUrl', () => {
  it('keeps http(s) URLs', () => {
    expect(normalizeHubUrl('https://example.com/x')).toBe('https://example.com/x')
    expect(normalizeHubUrl('http://example.com')).toBe('http://example.com')
  })
  it('assumes https when the scheme is missing', () => {
    expect(normalizeHubUrl('example.com/page')).toBe('https://example.com/page')
  })
  it('never lets a raw javascript:/data: scheme survive', () => {
    // Re-hosting under https:// turns these into invalid URLs → null, so the
    // dangerous scheme can never reach an href/src.
    expect(normalizeHubUrl('javascript:alert(1)')?.startsWith('javascript:')).not.toBe(true)
    expect(normalizeHubUrl('data:text/html,<script>')?.startsWith('data:')).not.toBe(true)
  })
  it('rejects empty and over-long URLs', () => {
    expect(normalizeHubUrl('')).toBeNull()
    expect(normalizeHubUrl('a'.repeat(HUB_LIMITS.url + 10))).toBeNull()
  })
})

describe('sanitizeHubItem', () => {
  it('requires a non-empty title', () => {
    const res = sanitizeHubItem({ type: 'text', title: 'Note', content: 'hi' })
    expect(res.ok).toBe(true)
    const bad = sanitizeHubItem({ type: 'text', title: '   ', content: 'hi' })
    expect(bad.ok).toBe(false)
  })

  it('validates a link block', () => {
    const res = sanitizeHubItem({ type: 'link', title: 'Site', url: 'example.com' })
    expect(res).toMatchObject({ ok: true, value: { type: 'link', url: 'https://example.com' } })
    const bad = sanitizeHubItem({ type: 'link', title: 'Site', url: '' })
    expect(bad.ok).toBe(false)
  })

  it('runs richtext through the injected sanitizer', () => {
    const res = sanitizeHubItem(
      { type: 'richtext', title: 'T', content: '<p>ok</p><script>evil()</script>' },
      (html) => html.replace(/<script>.*?<\/script>/g, ''),
    )
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.value.content).toBe('<p>ok</p>')
  })

  it('requires a source for media blocks', () => {
    expect(sanitizeHubItem({ type: 'image', title: 'Pic' }).ok).toBe(false)
    expect(
      sanitizeHubItem({ type: 'image', title: 'Pic', fileUrl: 'https://blob/x.png' }).ok,
    ).toBe(true)
    expect(
      sanitizeHubItem({ type: 'video', title: 'V', url: 'https://youtu.be/abc' }).ok,
    ).toBe(true)
  })

  it('requires an uploaded file for the file block', () => {
    expect(sanitizeHubItem({ type: 'file', title: 'Doc' }).ok).toBe(false)
    const ok = sanitizeHubItem({
      type: 'file', title: 'Doc', fileUrl: 'https://blob/x.pdf', fileName: 'x.pdf', fileSize: 10, fileType: 'application/pdf',
    })
    expect(ok).toMatchObject({ ok: true, value: { fileName: 'x.pdf', fileSize: 10 } })
  })

  it('rejects an embed from a non-allowlisted host', () => {
    expect(sanitizeHubItem({ type: 'embed', title: 'E', url: 'https://evil.example/x' }).ok).toBe(false)
    expect(
      sanitizeHubItem({ type: 'embed', title: 'E', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' }).ok,
    ).toBe(true)
  })

  it('caps over-long fields', () => {
    const res = sanitizeHubItem({ type: 'text', title: 'x'.repeat(500), content: 'hi' })
    if (res.ok) expect(res.value.title.length).toBe(HUB_LIMITS.title)
  })
})

describe('parseHubEmbed', () => {
  it('builds safe YouTube embeds', () => {
    const e = parseHubEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(e?.provider).toBe('YouTube')
    expect(e?.src).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })
  it('builds Vimeo / Spotify / Drive embeds', () => {
    expect(parseHubEmbed('https://vimeo.com/123456789')?.src).toBe('https://player.vimeo.com/video/123456789')
    expect(parseHubEmbed('https://open.spotify.com/track/abc123')?.src).toBe('https://open.spotify.com/embed/track/abc123')
    expect(parseHubEmbed('https://drive.google.com/file/d/ABCDEFGHIJ/view')?.src).toContain('/preview')
  })
  it('returns null for unknown hosts', () => {
    expect(parseHubEmbed('https://evil.example/embed')).toBeNull()
    expect(parseHubEmbed('not a url at all !!!')).toBeNull()
  })
})

describe('markdownToHtml', () => {
  it('renders headings, emphasis and lists', () => {
    const html = markdownToHtml('# Title\n\nHello **bold** and *em*\n\n- a\n- b')
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>em</em>')
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>a</li>')
  })

  it('escapes raw HTML so it cannot inject markup', () => {
    const html = markdownToHtml('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('only emits http(s) links and images', () => {
    const html = markdownToHtml('[x](javascript:alert(1)) and ![y](https://ex.com/a.png)')
    expect(html).not.toContain('javascript:')
    expect(html).toContain('<img src="https://ex.com/a.png"')
  })

  it('renders fenced code blocks with escaped content', () => {
    const html = markdownToHtml('```js\nconst x = 1 < 2\n```')
    expect(html).toContain('<pre><code class="language-js">')
    expect(html).toContain('1 &lt; 2')
  })
})
