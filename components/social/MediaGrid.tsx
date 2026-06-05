'use client'

import type { MediaCardData } from '@/lib/media'
import MediaCard from './MediaCard'
import MediaModal, { useOpenMedia } from './MediaModal'

/**
 * A wrapping gallery of media cards sharing one player modal — used by the
 * dedicated per-topic pages. Must be mounted inside a <Suspense> boundary
 * (the modal reads the URL search params).
 */
export default function MediaGrid({ items }: { items: MediaCardData[] }) {
  const openMedia = useOpenMedia()
  return (
    <>
      <div className="flex flex-wrap items-start gap-3 sm:gap-4">
        {items.map((item) => (
          <MediaCard key={item.id} item={item} onOpen={openMedia} />
        ))}
      </div>
      <MediaModal items={items} />
    </>
  )
}
