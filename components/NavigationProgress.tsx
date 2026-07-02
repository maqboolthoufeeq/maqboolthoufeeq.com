'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * A thin top-of-page progress bar that gives *instant* feedback the moment a
 * link is clicked — before the (often server-rendered) destination is ready.
 *
 * It works by listening for clicks on internal anchors in the capture phase,
 * crawling a bar toward ~90%, then snapping to 100% and fading out once the
 * route (pathname *or* query string) actually changes. This directly fixes the
 * "I clicked but nothing happened" gap on dynamic pages, and pairs with the
 * route-level `loading.tsx` skeletons for perceived speed.
 */
export default function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [bar, setBar] = useState<{ w: number; on: boolean; slow: boolean }>({ w: 0, on: false, slow: false })
  const running = useRef(false)
  const watchdog = useRef<number | null>(null)

  // Route committed → finish the bar. Only acts if a navigation was in flight.
  useEffect(() => {
    if (!running.current) return
    running.current = false
    if (watchdog.current) window.clearTimeout(watchdog.current)
    setBar({ w: 100, on: true, slow: false })
    const t = window.setTimeout(() => setBar({ w: 0, on: false, slow: false }), 240)
    return () => window.clearTimeout(t)
  }, [pathname, searchParams])

  useEffect(() => {
    function begin() {
      if (running.current) return
      running.current = true
      setBar({ w: 3, on: true, slow: false })
      // Two rAFs so the browser paints the 3% start before the slow crawl kicks in.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setBar({ w: 90, on: true, slow: true })),
      )
      // Safety net: if the click ends up NOT navigating (e.g. a prevented link),
      // the route effect never fires — auto-clear so the bar can't get stuck.
      if (watchdog.current) window.clearTimeout(watchdog.current)
      watchdog.current = window.setTimeout(() => {
        running.current = false
        setBar({ w: 100, on: true, slow: false })
        window.setTimeout(() => setBar({ w: 0, on: false, slow: false }), 240)
      }, 10000)
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a) return
      if (a.target && a.target !== '_self') return
      if (a.hasAttribute('download')) return
      const href = a.getAttribute('href') || ''
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      let url: URL
      try {
        url = new URL(href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      // Same page (including pure hash changes) → no navigation, no bar.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      begin()
    }

    // Note: we intentionally don't start the bar on `popstate`. Back/forward is
    // already fast and covered by the route-level loading.tsx skeleton, and some
    // history entries (e.g. the project modal's client-side pushState) aren't Next
    // route changes — starting the bar for those would leave it hanging since the
    // pathname/searchParams completion signal never fires for them.
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      if (watchdog.current) window.clearTimeout(watchdog.current)
    }
  }, [])

  if (!bar.on && bar.w === 0) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
      <div
        className="h-full rounded-r-full bg-[var(--accent)]"
        style={{
          width: `${bar.w}%`,
          opacity: bar.on ? 1 : 0,
          boxShadow: '0 0 8px var(--accent), 0 0 4px var(--accent)',
          transition: bar.slow
            ? 'width 12s cubic-bezier(0.08, 0.7, 0.2, 1)'
            : 'width 0.2s ease, opacity 0.35s ease 0.1s',
        }}
      />
    </div>
  )
}
