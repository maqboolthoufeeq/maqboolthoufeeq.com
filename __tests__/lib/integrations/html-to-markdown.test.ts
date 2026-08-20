import { htmlToMarkdown, htmlToPlainText, truncate } from '@/lib/integrations/html-to-markdown'

describe('htmlToMarkdown', () => {
  it('converts headings', () => {
    expect(htmlToMarkdown('<h1>Title</h1>')).toBe('# Title')
    expect(htmlToMarkdown('<h3>Sub</h3>')).toBe('### Sub')
  })

  it('converts paragraphs and inline emphasis', () => {
    const md = htmlToMarkdown('<p>Hello <strong>bold</strong> and <em>italic</em> and <s>strike</s>.</p>')
    expect(md).toBe('Hello **bold** and *italic* and ~~strike~~.')
  })

  it('converts links and images', () => {
    expect(htmlToMarkdown('<p><a href="https://x.com">X</a></p>')).toBe('[X](https://x.com)')
    expect(htmlToMarkdown('<p><img src="https://img/x.png" alt="alt"></p>')).toBe('![alt](https://img/x.png)')
  })

  it('converts unordered and ordered lists', () => {
    expect(htmlToMarkdown('<ul><li>a</li><li>b</li></ul>')).toBe('- a\n- b')
    expect(htmlToMarkdown('<ol><li>one</li><li>two</li></ol>')).toBe('1. one\n2. two')
  })

  it('converts nested lists with indentation', () => {
    const md = htmlToMarkdown('<ul><li>top<ul><li>nested</li></ul></li></ul>')
    expect(md).toBe('- top\n  - nested')
  })

  it('converts a fenced code block with language', () => {
    const md = htmlToMarkdown('<pre><code class="language-ts">const x = 1</code></pre>')
    expect(md).toBe('```ts\nconst x = 1\n```')
  })

  it('keeps inline code verbatim (no escaping inside)', () => {
    expect(htmlToMarkdown('<p>use <code>a*b_c</code></p>')).toBe('use `a*b_c`')
  })

  it('converts blockquotes', () => {
    expect(htmlToMarkdown('<blockquote><p>quoted</p></blockquote>')).toBe('> quoted')
  })

  it('converts a table to GFM', () => {
    const html = '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>'
    expect(htmlToMarkdown(html)).toBe('| A | B |\n| --- | --- |\n| 1 | 2 |')
  })

  it('decodes HTML entities', () => {
    expect(htmlToMarkdown('<p>a &amp; b &lt; c</p>')).toBe('a & b < c')
  })

  it('collapses excess blank lines between blocks', () => {
    const md = htmlToMarkdown('<h1>T</h1><p>one</p><p>two</p>')
    expect(md).toBe('# T\n\none\n\ntwo')
  })

  it('returns empty string for empty input', () => {
    expect(htmlToMarkdown('')).toBe('')
  })
})

describe('htmlToPlainText', () => {
  it('strips tags to plain text', () => {
    expect(htmlToPlainText('<h1>Hi</h1><p>there <strong>world</strong></p>')).toBe('Hi there world')
  })
})

describe('truncate', () => {
  it('leaves short strings unchanged', () => {
    expect(truncate('short', 20)).toBe('short')
  })
  it('truncates on a word boundary with an ellipsis', () => {
    const out = truncate('the quick brown fox jumps', 15)
    expect(out.length).toBeLessThanOrEqual(15)
    expect(out.endsWith('…')).toBe(true)
  })
})
