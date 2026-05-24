'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check } from 'lucide-react'

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
      className="row-pressable w-full h-11 flex items-center justify-center gap-2 text-sm font-medium text-[var(--accent)] disabled:opacity-50"
    >
      <Check size={16} />
      {loading ? 'Marking…' : 'Mark as read'}
    </button>
  )
}
