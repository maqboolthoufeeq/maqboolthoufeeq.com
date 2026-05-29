'use client'

import { useState, useEffect } from 'react'

function getGoogleDriveEmbedUrl(url: string): string | null {
  const m = url.match(/drive\.google\.com\/file\/d\/([^/?\s]+)/)
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`
  return null
}

function urlToEmbedHtml(url: string): string | null {
  if (/\.(jpe?g|png|gif|webp|svg|bmp|ico)(\?[^\s]*)?$/i.test(url)) {
    return `<img src="${url}" alt="" style="max-width:100%;border-radius:6px;" />`
  }
  if (/\.(mp4|webm|ogg|mov|avi)(\?[^\s]*)?$/i.test(url)) {
    return `<video controls style="max-width:100%;border-radius:6px;"><source src="${url}" /></video>`
  }
  if (/\.pdf(\?[^\s]*)?$/i.test(url)) {
    return `<iframe src="${url}" width="100%" height="500px" style="border:none;border-radius:6px;"></iframe>`
  }
  const driveEmbed = getGoogleDriveEmbedUrl(url)
  if (driveEmbed) {
    return `<iframe src="${driveEmbed}" width="100%" height="500px" style="border:none;border-radius:6px;" allow="autoplay"></iframe>`
  }
  return null
}

function processStandaloneUrls(html: string): string {
  if (typeof window === 'undefined') return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('p').forEach(p => {
    // Plain URL as a text node
    if (p.childNodes.length === 1 && p.childNodes[0].nodeType === 3) {
      const text = p.textContent?.trim() ?? ''
      if (/^https?:\/\/\S+$/.test(text)) {
        const embed = urlToEmbedHtml(text)
        if (embed) {
          const tmp = document.createElement('div')
          tmp.innerHTML = embed
          p.replaceWith(tmp.firstElementChild ?? tmp)
        }
      }
    }
    // Anchor whose visible text is identical to its href (auto-linked URL)
    else if (p.childNodes.length === 1 && p.firstElementChild?.tagName === 'A') {
      const anchor = p.firstElementChild as HTMLAnchorElement
      const href = anchor.getAttribute('href') ?? ''
      const text = anchor.textContent?.trim() ?? ''
      if (href && href === text && /^https?:\/\/\S+$/.test(href)) {
        const embed = urlToEmbedHtml(href)
        if (embed) {
          const tmp = document.createElement('div')
          tmp.innerHTML = embed
          p.replaceWith(tmp.firstElementChild ?? tmp)
        }
      }
    }
  })
  return doc.body.innerHTML
}

export default function PostContent({ html }: { html: string }) {
  // `html` is already sanitized on the server (see lib/sanitize.ts). Here we
  // only apply client-side enhancement: turning standalone media URLs into
  // embeds. The initial render matches the server output (no hydration drift);
  // the effect upgrades standalone URLs after hydration.
  const [displayed, setDisplayed] = useState(html)

  useEffect(() => {
    setDisplayed(processStandaloneUrls(html))
  }, [html])

  return (
    <div
      className="prose dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: displayed }}
    />
  )
}
