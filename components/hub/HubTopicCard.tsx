import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { HubTopicSummary } from '@/lib/hub'

/**
 * A card showing a hub topic: icon, title, description, subtopics/items count,
 * optional coverImage, category, and tags. Links to /hub/{slug}.
 */
export function HubTopicCard({ topic }: { topic: HubTopicSummary }) {
  // Use emoji/icon if present, else first letter of title
  const displayIcon = topic.icon || (topic.title[0]?.toUpperCase() ?? '?')

  return (
    <Link
      href={`/hub/${topic.slug}`}
      className="row-pressable group block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)]"
    >
      {/* Cover image background (if present) */}
      {topic.coverImage && (
        <div
          className="absolute inset-0 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity"
          style={{
            backgroundImage: `url(${topic.coverImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Content (relative to background) */}
      <div className="relative space-y-2">
        {/* Icon + Title */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-xl font-semibold text-[var(--accent)]">
            {displayIcon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
              {topic.title}
            </h3>
          </div>
        </div>

        {/* Description (clamped) */}
        {topic.description && (
          <p className="text-sm text-[var(--muted)] line-clamp-2">{topic.description}</p>
        )}

        {/* Category + Tags */}
        {(topic.category || topic.tags.length > 0) && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {topic.category && (
              <span
                className="inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium text-white"
                style={{ backgroundColor: topic.category.color || 'var(--accent)' }}
              >
                {topic.category.name}
              </span>
            )}
            {topic.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.slug}
                className="inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium border border-[var(--border)] text-[var(--muted)]"
              >
                #{tag.name}
              </span>
            ))}
            {topic.tags.length > 2 && (
              <span className="inline-flex items-center h-5 px-2 text-[11px] font-medium text-[var(--muted)]">
                +{topic.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Meta: subtopics + items count */}
        <div className="flex items-center gap-4 pt-3 text-xs text-[var(--muted)]">
          {topic.childCount > 0 && (
            <span className="flex items-center gap-1">
              {topic.childCount} subtopic{topic.childCount === 1 ? '' : 's'}
            </span>
          )}
          {topic.itemCount > 0 && (
            <span className="flex items-center gap-1">
              {topic.itemCount} item{topic.itemCount === 1 ? '' : 's'}
            </span>
          )}
          {topic.childCount === 0 && topic.itemCount === 0 && (
            <span className="text-[var(--muted)]/60">Empty</span>
          )}
          <span className="ml-auto text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  )
}
