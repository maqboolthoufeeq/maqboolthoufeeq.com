'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Fires a lightweight visit beacon on each public page load. Admin routes are
 * skipped. A ref keyed by pathname prevents double-counting from React strict
 * mode's double-invoke in development.
 */
export default function VisitTracker() {
  const pathname = usePathname()
  const lastCounted = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return
    if (lastCounted.current === pathname) return
    lastCounted.current = pathname

    // keepalive lets the request survive a fast navigation away
    fetch('/api/analytics/visit', { method: 'POST', keepalive: true }).catch(() => {})
  }, [pathname])

  return null
}
