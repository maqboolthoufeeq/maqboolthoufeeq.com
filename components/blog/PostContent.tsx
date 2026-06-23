'use client'

import { useState, useEffect, useRef } from 'react'

// Inline lucide-style icons (markup mirrors lucide-react so injected buttons
// match the icons used elsewhere on the site).
const COPY_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>'

const CHECK_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'

function copyText(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text)
  }
  // Fallback for insecure contexts where the async Clipboard API is missing.
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      if (ok) resolve()
      else reject(new Error('copy command failed'))
    } catch (err) {
      reject(err)
    }
  })
}

// Wraps each <pre> code block and injects an icon-only copy button that shows a
// "copied" check animation on a successful copy, then reverts.
function addCopyButtons(root: HTMLElement) {
  root.querySelectorAll('pre').forEach(pre => {
    if (pre.dataset.copyEnhanced) return
    pre.dataset.copyEnhanced = '1'

    const wrapper = document.createElement('div')
    wrapper.className = 'code-block-wrapper'
    pre.parentNode?.insertBefore(wrapper, pre)
    wrapper.appendChild(pre)

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'code-copy-btn'
    btn.title = 'Copy code'
    btn.setAttribute('aria-label', 'Copy code')
    btn.innerHTML =
      `<span class="code-copy-icon code-copy-icon--copy">${COPY_ICON}</span>` +
      `<span class="code-copy-icon code-copy-icon--check">${CHECK_ICON}</span>`

    let resetTimer: ReturnType<typeof setTimeout> | undefined
    btn.addEventListener('click', () => {
      const code = pre.querySelector('code')
      const text = (code ?? pre).textContent ?? ''
      copyText(text)
        .then(() => {
          btn.classList.add('copied')
          btn.setAttribute('aria-label', 'Copied')
          if (resetTimer) clearTimeout(resetTimer)
          resetTimer = setTimeout(() => {
            btn.classList.remove('copied')
            btn.setAttribute('aria-label', 'Copy code')
          }, 1800)
        })
        .catch(() => {
          // Clipboard unavailable / permission denied — leave the button as-is.
        })
    })

    wrapper.appendChild(btn)
  })
}

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
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDisplayed(processStandaloneUrls(html))
  }, [html])

  // Enhance code blocks with copy buttons after each render of the content.
  useEffect(() => {
    if (containerRef.current) addCopyButtons(containerRef.current)
  }, [displayed])

  return (
    <div
      ref={containerRef}
      className="prose dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: displayed }}
    />
  )
}
