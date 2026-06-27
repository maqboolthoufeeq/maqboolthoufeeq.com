import {
  isHubItemType,
  normalizeHubUrl,
  sanitizeHubItem,
  parseHubEmbed,
  canonicalizeHubEmbed,
  aspectClass,
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

const CANVA_URL = 'https://www.canva.com/design/DAHNzsLDtUQ/mMNPYldxLclU76HhVLc-dw/watch'

// The exact snippet Canva's "embed" button produces for a portrait reel cover.
const CANVA_EMBED_HTML = `
<div style="position: relative; width: 100%; height: 0; padding-top: 177.7778%;
 padding-bottom: 0; box-shadow: 0 2px 8px 0 rgba(63,69,81,0.16); margin-top: 1.6em; margin-bottom: 0.9em; overflow: hidden;
 border-radius: 8px; will-change: transform;">
  <iframe loading="lazy" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; border: none; padding: 0;margin: 0;"
    src="https://www.canva.com/design/DAHNzsLDtUQ/mMNPYldxLclU76HhVLc-dw/watch?embed" allowfullscreen="allowfullscreen" allow="fullscreen">
  </iframe>
</div>
<a href="https:&#x2F;&#x2F;www.canva.com&#x2F;design&#x2F;DAHNzsLDtUQ&#x2F;mMNPYldxLclU76HhVLc-dw&#x2F;watch?utm_content=DAHNzsLDtUQ&amp;utm_campaign=designshare&amp;utm_medium=embeds&amp;utm_source=link" target="_blank" rel="noopener">Instagram reel Cover Design elements</a> by Maqbool Thoufeeq.T`

describe('parseHubEmbed — Canva', () => {
  it('builds a safe embed from a plain Canva watch URL (default aspect)', () => {
    const e = parseHubEmbed(CANVA_URL)
    expect(e?.provider).toBe('Canva')
    expect(e?.src).toBe('https://www.canva.com/design/DAHNzsLDtUQ/mMNPYldxLclU76HhVLc-dw/watch?embed')
    expect(e?.aspect).toBe('video')
    expect(e?.allowFullScreen).toBe(true)
  })

  it('preserves the /view variant', () => {
    expect(parseHubEmbed('https://www.canva.com/design/AAA/bbb-cc/view')?.src)
      .toBe('https://www.canva.com/design/AAA/bbb-cc/view?embed')
  })
})

describe('parseHubEmbed — pasted embed code', () => {
  it('extracts the iframe src from a full Canva snippet and detects portrait aspect', () => {
    const e = parseHubEmbed(CANVA_EMBED_HTML)
    expect(e?.provider).toBe('Canva')
    expect(e?.src).toBe('https://www.canva.com/design/DAHNzsLDtUQ/mMNPYldxLclU76HhVLc-dw/watch?embed')
    expect(e?.aspect).toBe('portrait') // padding-top: 177.7778% ⇒ 9:16
  })

  it('works for any allow-listed provider snippet (e.g. a YouTube iframe)', () => {
    const html = '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" allowfullscreen></iframe>'
    const e = parseHubEmbed(html)
    expect(e?.provider).toBe('YouTube')
    expect(e?.src).toContain('dQw4w9WgXcQ')
    expect(e?.aspect).toBe('video') // 560×315 ⇒ 16:9
  })

  it('never trusts an iframe pointing at a non-allowlisted host', () => {
    expect(parseHubEmbed('<iframe src="https://evil.example/phish"></iframe>')).toBeNull()
    expect(parseHubEmbed('<iframe src="javascript:alert(1)"></iframe>')).toBeNull()
  })
})

describe('parseHubEmbed — host hardening', () => {
  it('accepts a genuine Google Maps embed but rejects spoofed subdomains', () => {
    expect(parseHubEmbed('https://www.google.com/maps/embed?pb=!1m18')?.provider).toBe('Google Maps')
    expect(parseHubEmbed('https://maps.evil.google.com/maps/embed?pb=x')).toBeNull()
    expect(parseHubEmbed('https://google.com.evil.com/maps/embed?pb=x')).toBeNull()
  })
})

describe('canonicalizeHubEmbed', () => {
  it('returns a clean re-parseable URL for a plain provider URL', () => {
    const url = canonicalizeHubEmbed(CANVA_URL)
    expect(url).toBe('https://www.canva.com/design/DAHNzsLDtUQ/mMNPYldxLclU76HhVLc-dw/watch')
    expect(parseHubEmbed(url ?? "")?.provider).toBe('Canva')
  })

  it('persists a detected aspect in a fragment that round-trips through parseHubEmbed', () => {
    const url = canonicalizeHubEmbed(CANVA_EMBED_HTML)
    expect(url).toContain('embed-aspect=portrait')
    const e = parseHubEmbed(url ?? "")
    expect(e?.provider).toBe('Canva')
    expect(e?.aspect).toBe('portrait')
    expect(e?.src).not.toContain('embed-aspect') // our hint never leaks into the iframe src
  })

  it('rejects non-embeddable input', () => {
    expect(canonicalizeHubEmbed('https://evil.example/x')).toBeNull()
    expect(canonicalizeHubEmbed('javascript:alert(1)')).toBeNull()
    expect(canonicalizeHubEmbed('')).toBeNull()
  })
})

describe('sanitizeHubItem — embed (URL or pasted code)', () => {
  it('accepts a full pasted embed snippet and stores a safe re-parseable url', () => {
    const res = sanitizeHubItem({ type: 'embed', title: 'Reel cover', url: CANVA_EMBED_HTML })
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.value.url).toContain('canva.com/design/DAHNzsLDtUQ')
      expect(parseHubEmbed(res.value.url ?? "")?.aspect).toBe('portrait')
    }
  })

  it('accepts a plain Canva URL', () => {
    expect(sanitizeHubItem({ type: 'embed', title: 'C', url: CANVA_URL }).ok).toBe(true)
  })

  it('rejects an un-embeddable site or raw markup', () => {
    expect(sanitizeHubItem({ type: 'embed', title: 'E', url: 'https://evil.example/x' }).ok).toBe(false)
    expect(sanitizeHubItem({ type: 'embed', title: 'E', url: '<iframe src="https://evil.example/x"></iframe>' }).ok).toBe(false)
  })
})

describe('aspectClass', () => {
  it('maps every aspect including the new portrait', () => {
    expect(aspectClass('video')).toBe('aspect-video')
    expect(aspectClass('square')).toBe('aspect-square')
    expect(aspectClass('tall')).toBe('aspect-[3/4]')
    expect(aspectClass('portrait')).toBe('aspect-[9/16]')
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
