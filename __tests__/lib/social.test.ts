import {
  parseYouTubeId,
  parseInstagramShortcode,
  detectPlatform,
  parseEmbedId,
  youTubeThumbnail,
  youTubeEmbedUrl,
  instagramEmbedUrl,
  permalinkFor,
  resolveThumbnail,
  orientationFor,
  aspectClassFor,
  isPlatform,
  isHttpUrl,
  mediaLengthError,
  isYouTubeShortUrl,
  mediaOrientation,
  aspectClassForOrientation,
  sanitizeMediaLinks,
  sanitizeMediaAttachments,
  attachmentKind,
  formatBytes,
  MEDIA_LINK_LIMIT,
  MEDIA_ATTACHMENT_LIMIT,
} from '@/lib/social'

describe('parseYouTubeId', () => {
  it('parses the watch?v= form', () => {
    expect(parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('parses extra query params around v=', () => {
    expect(parseYouTubeId('https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s&list=abc')).toBe('dQw4w9WgXcQ')
  })

  it('parses the youtu.be short form', () => {
    expect(parseYouTubeId('https://youtu.be/dQw4w9WgXcQ?si=xyz')).toBe('dQw4w9WgXcQ')
  })

  it('parses /shorts/ URLs', () => {
    expect(parseYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('parses /embed/ URLs', () => {
    expect(parseYouTubeId('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('parses m.youtube.com URLs', () => {
    expect(parseYouTubeId('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('accepts a bare 11-char id', () => {
    expect(parseYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('returns null for non-YouTube URLs', () => {
    expect(parseYouTubeId('https://vimeo.com/12345')).toBeNull()
    expect(parseYouTubeId('https://www.instagram.com/reel/abc/')).toBeNull()
  })

  it('returns null for empty input', () => {
    expect(parseYouTubeId('')).toBeNull()
  })
})

describe('parseInstagramShortcode', () => {
  it('parses /reel/ URLs', () => {
    expect(parseInstagramShortcode('https://www.instagram.com/reel/Cabc123_-X/')).toBe('Cabc123_-X')
  })

  it('parses /reels/ URLs', () => {
    expect(parseInstagramShortcode('https://instagram.com/reels/Cabc123/')).toBe('Cabc123')
  })

  it('parses /p/ post URLs', () => {
    expect(parseInstagramShortcode('https://www.instagram.com/p/Cxyz789/')).toBe('Cxyz789')
  })

  it('parses /tv/ URLs', () => {
    expect(parseInstagramShortcode('https://www.instagram.com/tv/Cxyz789/')).toBe('Cxyz789')
  })

  it('ignores a leading username segment', () => {
    expect(parseInstagramShortcode('https://www.instagram.com/someuser/reel/Cabc123/')).toBe('Cabc123')
  })

  it('returns null for non-Instagram URLs', () => {
    expect(parseInstagramShortcode('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull()
  })

  it('returns null for a profile URL with no shortcode', () => {
    expect(parseInstagramShortcode('https://www.instagram.com/someuser/')).toBeNull()
  })

  it('rejects spoofed instagram.com subdomains', () => {
    expect(parseInstagramShortcode('https://evil.instagram.com/reel/Cabc123/')).toBeNull()
    expect(parseInstagramShortcode('https://instagram.com.evil.com/reel/Cabc123/')).toBeNull()
  })
})

describe('detectPlatform', () => {
  it('detects youtube', () => {
    expect(detectPlatform('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube')
  })
  it('detects instagram', () => {
    expect(detectPlatform('https://www.instagram.com/reel/Cabc123/')).toBe('instagram')
  })
  it('returns null for unknown', () => {
    expect(detectPlatform('https://example.com')).toBeNull()
  })
})

describe('parseEmbedId', () => {
  it('routes to the right parser', () => {
    expect(parseEmbedId('youtube', 'https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(parseEmbedId('instagram', 'https://www.instagram.com/reel/Cabc123/')).toBe('Cabc123')
  })
  it('returns null on platform/URL mismatch', () => {
    expect(parseEmbedId('youtube', 'https://www.instagram.com/reel/Cabc123/')).toBeNull()
  })
})

describe('url builders', () => {
  it('builds a YouTube thumbnail URL', () => {
    expect(youTubeThumbnail('dQw4w9WgXcQ')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
    expect(youTubeThumbnail('dQw4w9WgXcQ', 'maxres')).toContain('maxresdefault.jpg')
  })

  it('builds a chromeless muted YouTube embed for previews', () => {
    const url = youTubeEmbedUrl('dQw4w9WgXcQ', { autoplay: true, mute: true, controls: false, loop: true })
    expect(url).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(url).toContain('autoplay=1')
    expect(url).toContain('mute=1')
    expect(url).toContain('controls=0')
    expect(url).toContain('playlist=dQw4w9WgXcQ') // loop needs playlist=self
  })

  it('builds a full-controls YouTube embed by default', () => {
    const url = youTubeEmbedUrl('dQw4w9WgXcQ')
    expect(url).toContain('controls=1')
  })

  it('builds an Instagram embed URL', () => {
    expect(instagramEmbedUrl('Cabc123')).toBe('https://www.instagram.com/reel/Cabc123/embed/')
    expect(instagramEmbedUrl('Cabc123', true)).toBe('https://www.instagram.com/reel/Cabc123/embed/captioned/')
  })

  it('builds canonical permalinks', () => {
    expect(permalinkFor('youtube', 'dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(permalinkFor('instagram', 'Cabc123')).toBe('https://www.instagram.com/reel/Cabc123/')
  })
})

describe('resolveThumbnail', () => {
  it('prefers a custom thumbnail', () => {
    expect(resolveThumbnail('youtube', 'dQw4w9WgXcQ', 'https://cdn/x.jpg')).toBe('https://cdn/x.jpg')
  })
  it('auto-derives for YouTube when no custom thumbnail', () => {
    expect(resolveThumbnail('youtube', 'dQw4w9WgXcQ')).toContain('i.ytimg.com')
  })
  it('returns null for Instagram with no custom thumbnail', () => {
    expect(resolveThumbnail('instagram', 'Cabc123')).toBeNull()
  })
})

describe('isHttpUrl', () => {
  it('accepts empty / blank values (field is optional)', () => {
    expect(isHttpUrl('')).toBe(true)
    expect(isHttpUrl('   ')).toBe(true)
    expect(isHttpUrl(null)).toBe(true)
    expect(isHttpUrl(undefined)).toBe(true)
  })
  it('accepts http and https URLs', () => {
    expect(isHttpUrl('https://cdn.example.com/x.jpg')).toBe(true)
    expect(isHttpUrl('http://example.com/x.mp4')).toBe(true)
  })
  it('rejects dangerous / non-http schemes', () => {
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('data:image/png;base64,AAAA')).toBe(false)
    expect(isHttpUrl('file:///etc/passwd')).toBe(false)
    expect(isHttpUrl('not a url')).toBe(false)
  })
})

describe('mediaLengthError', () => {
  it('passes within limits', () => {
    expect(mediaLengthError({ title: 'ok', description: 'fine', sourceUrl: 'https://x.com' })).toBeNull()
  })
  it('flags an over-long title', () => {
    expect(mediaLengthError({ title: 'a'.repeat(201) })).toMatch(/title/i)
  })
  it('flags an over-long url', () => {
    expect(mediaLengthError({ sourceUrl: 'h'.repeat(2049) })).toMatch(/url/i)
  })
  it('ignores non-string values', () => {
    expect(mediaLengthError({ title: undefined, description: null as unknown as string })).toBeNull()
  })
})

describe('platform helpers', () => {
  it('reports orientation', () => {
    expect(orientationFor('instagram')).toBe('portrait')
    expect(orientationFor('youtube')).toBe('landscape')
  })
  it('reports aspect class', () => {
    expect(aspectClassFor('instagram')).toBe('aspect-[9/16]')
    expect(aspectClassFor('youtube')).toBe('aspect-video')
  })
  it('detects YouTube Shorts URLs', () => {
    expect(isYouTubeShortUrl('https://www.youtube.com/shorts/abc123')).toBe(true)
    expect(isYouTubeShortUrl('https://www.youtube.com/watch?v=abc123')).toBe(false)
    expect(isYouTubeShortUrl(null)).toBe(false)
  })
  it('orients reels and shorts as portrait, regular videos as landscape', () => {
    expect(mediaOrientation('instagram', 'https://www.instagram.com/reel/x/')).toBe('portrait')
    expect(mediaOrientation('youtube', 'https://www.youtube.com/shorts/x')).toBe('portrait')
    expect(mediaOrientation('youtube', 'https://www.youtube.com/watch?v=x')).toBe('landscape')
    expect(mediaOrientation('youtube', null)).toBe('landscape')
  })
  it('maps orientation to aspect class', () => {
    expect(aspectClassForOrientation('portrait')).toBe('aspect-[9/16]')
    expect(aspectClassForOrientation('landscape')).toBe('aspect-video')
  })
  it('guards platform values', () => {
    expect(isPlatform('instagram')).toBe(true)
    expect(isPlatform('youtube')).toBe(true)
    expect(isPlatform('tiktok')).toBe(false)
    expect(isPlatform(null)).toBe(false)
  })
})

describe('sanitizeMediaLinks', () => {
  it('keeps valid links and trims them', () => {
    expect(sanitizeMediaLinks([{ label: '  Read more ', url: 'https://example.com/a ' }])).toEqual([
      { label: 'Read more', url: 'https://example.com/a' },
    ])
  })

  it('adds https:// when the scheme is missing', () => {
    expect(sanitizeMediaLinks([{ label: 'Site', url: 'example.com/x' }])).toEqual([
      { label: 'Site', url: 'https://example.com/x' },
    ])
  })

  it('falls back to the URL as the label', () => {
    expect(sanitizeMediaLinks([{ url: 'https://example.com' }])).toEqual([
      { label: 'https://example.com', url: 'https://example.com' },
    ])
  })

  it('drops junk entries and never emits a non-http(s) URL', () => {
    const out = sanitizeMediaLinks([
      { label: 'empty', url: '' },
      { label: 'bad', url: 'javascript:alert(1)' },
      'not-an-object',
      null,
      { label: 'ok', url: 'https://good.com' },
    ])
    expect(out).toEqual([{ label: 'ok', url: 'https://good.com' }])
    expect(out.every((l) => /^https?:\/\//.test(l.url))).toBe(true)
  })

  it('returns [] for non-array input', () => {
    expect(sanitizeMediaLinks(undefined)).toEqual([])
    expect(sanitizeMediaLinks('nope')).toEqual([])
  })

  it('caps the number of links', () => {
    const many = Array.from({ length: MEDIA_LINK_LIMIT + 5 }, (_, i) => ({ label: `L${i}`, url: `https://e.com/${i}` }))
    expect(sanitizeMediaLinks(many)).toHaveLength(MEDIA_LINK_LIMIT)
  })
})

describe('sanitizeMediaAttachments', () => {
  it('keeps a well-formed attachment', () => {
    expect(
      sanitizeMediaAttachments([{ name: 'Report.pdf', url: 'https://blob/x.pdf', size: 1234, type: 'application/pdf' }]),
    ).toEqual([{ name: 'Report.pdf', url: 'https://blob/x.pdf', size: 1234, type: 'application/pdf' }])
  })

  it('defaults a missing name and normalises bad size/type', () => {
    expect(sanitizeMediaAttachments([{ url: 'https://blob/x', size: -3, type: 42 }])).toEqual([
      { name: 'Attachment', url: 'https://blob/x', size: null, type: null },
    ])
  })

  it('drops entries without a valid http(s) URL', () => {
    expect(sanitizeMediaAttachments([{ name: 'x', url: 'ftp://nope' }, { name: 'y', url: '' }])).toEqual([])
  })

  it('caps the number of attachments', () => {
    const many = Array.from({ length: MEDIA_ATTACHMENT_LIMIT + 3 }, (_, i) => ({ name: `f${i}`, url: `https://b/${i}` }))
    expect(sanitizeMediaAttachments(many)).toHaveLength(MEDIA_ATTACHMENT_LIMIT)
  })
})

describe('attachmentKind', () => {
  it('detects by MIME type first', () => {
    expect(attachmentKind({ name: 'weird', type: 'image/png' })).toBe('image')
    expect(attachmentKind({ name: 'weird', type: 'video/mp4' })).toBe('video')
    expect(attachmentKind({ name: 'weird', type: 'audio/mpeg' })).toBe('audio')
    expect(attachmentKind({ name: 'weird', type: 'application/pdf' })).toBe('pdf')
  })

  it('falls back to the file extension', () => {
    expect(attachmentKind({ name: 'a.JPG', type: null })).toBe('image')
    expect(attachmentKind({ name: 'a.mov', type: null })).toBe('video')
    expect(attachmentKind({ name: 'a.pdf', type: null })).toBe('pdf')
    expect(attachmentKind({ name: 'a.docx', type: null })).toBe('doc')
  })
})

describe('formatBytes', () => {
  it('formats sizes and handles unknowns', () => {
    expect(formatBytes(null)).toBeNull()
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
  })
})
