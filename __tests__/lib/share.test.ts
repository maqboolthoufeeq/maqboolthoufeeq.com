import { buildShareLinks } from '@/lib/share'

const url = 'https://example.com/blog/hello-world'
const title = 'Hello, World & Friends'
const text = 'A short summary of the post.'

describe('buildShareLinks', () => {
  const links = buildShareLinks({ url, title, text })

  it('produces a link for every supported target', () => {
    expect(Object.keys(links).sort()).toEqual(
      ['email', 'facebook', 'linkedin', 'reddit', 'telegram', 'twitter', 'whatsapp'].sort(),
    )
  })

  it('URL-encodes the shared link in each target', () => {
    const encoded = encodeURIComponent(url)
    expect(links.linkedin).toContain(encoded)
    expect(links.facebook).toContain(encoded)
    expect(links.twitter).toContain(encoded)
    expect(links.telegram).toContain(encoded)
    expect(links.reddit).toContain(encoded)
  })

  it('LinkedIn uses the share-offsite endpoint with the url param', () => {
    expect(links.linkedin).toBe(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    )
  })

  it('Facebook uses the sharer endpoint', () => {
    expect(links.facebook).toBe(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    )
  })

  it('WhatsApp includes both the title and the url in the text', () => {
    expect(links.whatsapp).toBe(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${url}`)}`,
    )
  })

  it('X/Twitter includes url and encoded title', () => {
    expect(links.twitter).toContain(`url=${encodeURIComponent(url)}`)
    expect(links.twitter).toContain(`text=${encodeURIComponent(title)}`)
  })

  it('email mailto includes subject, the description and the url', () => {
    expect(links.email.startsWith('mailto:?')).toBe(true)
    expect(links.email).toContain(`subject=${encodeURIComponent(title)}`)
    expect(links.email).toContain(encodeURIComponent(text))
    expect(links.email).toContain(encodeURIComponent(url))
  })

  it('falls back to title in the email body when no text is given', () => {
    const noText = buildShareLinks({ url, title })
    expect(noText.email).toContain(encodeURIComponent(`${title}\n\n${url}`))
  })

  it('escapes special characters safely (no raw ampersand breaking params)', () => {
    expect(links.twitter).toContain('%26') // "&" in the title is encoded
  })
})
