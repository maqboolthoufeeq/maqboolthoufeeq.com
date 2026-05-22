'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function DesignSync({ designId }: { designId: string }) {
  const pathname = usePathname()

  useEffect(() => {
    // Apply the server-rendered value immediately (correct on full page loads)
    document.documentElement.setAttribute('data-design', designId)

    // Fetch authoritative value from API — handles client-side navigation where
    // the root layout RSC payload is served from the Router Cache and may be stale
    fetch('/api/admin/design', { cache: 'no-store' })
      .then((r) => r.json())
      .then(({ id }: { id: string }) => {
        if (id) document.documentElement.setAttribute('data-design', id)
      })
      .catch(() => {})
  }, [pathname, designId])

  return null
}
