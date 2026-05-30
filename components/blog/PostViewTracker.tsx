'use client'

import { useEffect, useRef } from 'react'

/**
 * Fires a lightweight view beacon once per browser per post. The first view is
 * remembered in localStorage so refreshes / revisits don't inflate the counter,
 * and a ref guards against React strict-mode's double-invoke in development.
 */
export default function PostViewTracker({ slug }: { slug: string }) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true

    const key = `viewed:${slug}`
    try {
      if (localStorage.getItem(key) === '1') return
    } catch {
      /* localStorage unavailable — still count, just without dedup */
    }

    fetch(`/api/blog/${slug}/view`, { method: 'POST', keepalive: true })
      .then((res) => {
        if (res.ok) {
          try {
            localStorage.setItem(key, '1')
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {})
  }, [slug])

  return null
}
