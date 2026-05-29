import { sanitizePostHtml } from '@/lib/sanitize'

describe('sanitizePostHtml', () => {
  it('preserves the rich content tags posts rely on', () => {
    const html =
      '<h2>Title</h2><p>Para</p><ul><li>a</li></ul><pre><code>x()</code></pre>' +
      '<blockquote>q</blockquote><hr/><a href="https://x.com">link</a>'
    const out = sanitizePostHtml(html)
    for (const tag of ['<h2>', '<p>', '<ul>', '<li>', '<pre>', '<code>', '<blockquote>', '<hr', '<a']) {
      expect(out).toContain(tag)
    }
    expect(out).toContain('href="https://x.com"')
  })

  it('preserves tables, images, video and inline styles', () => {
    const html =
      '<table><thead><tr><th>h</th></tr></thead><tbody><tr><td>c</td></tr></tbody></table>' +
      '<img src="https://cdn.example.com/a.png" alt="x" style="max-width:100%;border-radius:6px;" />' +
      '<video controls><source src="https://cdn.example.com/v.mp4" /></video>'
    const out = sanitizePostHtml(html)
    expect(out).toContain('<table>')
    expect(out).toContain('<th>')
    expect(out).toContain('<td>')
    expect(out).toContain('src="https://cdn.example.com/a.png"')
    // Inline styles are preserved (sanitize-html may normalize a trailing ';').
    expect(out).toMatch(/style="max-width:100%;border-radius:6px;?"/)
    expect(out).toContain('<video')
    expect(out).toContain('<source')
  })

  it('preserves author-controlled iframes (YouTube / Google Drive embeds)', () => {
    const html =
      '<iframe src="https://www.youtube.com/embed/abc123" allowfullscreen frameborder="0" data-youtube-video></iframe>'
    const out = sanitizePostHtml(html)
    expect(out).toContain('<iframe')
    expect(out).toContain('src="https://www.youtube.com/embed/abc123"')
  })

  it('allows data: URIs only on images', () => {
    expect(sanitizePostHtml('<img src="data:image/png;base64,AAAA" alt="" />')).toContain('data:image/png;base64,AAAA')
  })

  it('strips <script> and its contents', () => {
    const out = sanitizePostHtml('<p>safe</p><script>alert(document.cookie)</script>')
    expect(out).toContain('safe')
    expect(out).not.toContain('<script')
    expect(out).not.toContain('alert(document.cookie)')
  })

  it('strips inline event handlers and javascript: URLs (XSS vectors)', () => {
    const out = sanitizePostHtml('<a href="javascript:alert(1)" onclick="steal()">x</a><img src="x" onerror="hack()" />')
    expect(out).not.toContain('onclick')
    expect(out).not.toContain('onerror')
    expect(out).not.toContain('javascript:')
    expect(out).not.toContain('steal()')
  })

  it('drops disallowed embedding tags', () => {
    const out = sanitizePostHtml('<object data="x.swf"></object><embed src="x"><form><input></form>')
    expect(out).not.toContain('<object')
    expect(out).not.toContain('<embed')
    expect(out).not.toContain('<form')
    expect(out).not.toContain('<input')
  })

  it('returns a string for empty / non-markup input', () => {
    expect(typeof sanitizePostHtml('')).toBe('string')
    expect(sanitizePostHtml('just text')).toBe('just text')
  })
})
