'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function MarkReadButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function markRead() {
    setLoading(true)
    await fetch(`/api/contact/${id}/read`, { method: 'PATCH' })
    router.refresh()
  }

  return (
    <button
      onClick={markRead}
      disabled={loading}
      className="text-xs text-[var(--accent)] hover:underline disabled:opacity-50 transition-opacity"
    >
      {loading ? 'Marking…' : 'Mark read'}
    </button>
  )
}
