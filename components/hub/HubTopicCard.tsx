import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { HubTopicSummary } from '@/lib/hub'

/**
 * A hub topic as a clean, compact tappable row — icon, title, one-line summary
 * and a meta line. No cover imagery, tight rhythm (Linktree-style).
 */
export function HubTopicCard({ topic }: { topic: HubTopicSummary }) {
  const displayIcon = topic.icon || (topic.title[0]?.toUpperCase() ?? '?')

  const meta: string[] = []
  if (topic.childCount > 0) meta.push(`${topic.childCount} subtopic${topic.childCount === 1 ? '' : 's'}`)
  if (topic.itemCount > 0) meta.push(`${topic.itemCount} item${topic.itemCount === 1 ? '' : 's'}`)
  const summary = topic.description || meta.join(' · ') || 'Empty'

  return (
    <Link
      href={`/hub/${topic.slug}`}
      className="group flex items-center gap-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 transition-all hover:border-[var(--accent)] hover:bg-[var(--accent)]/[0.05] active:scale-[0.99]"
    >
      <span className="shrink-0 grid place-items-center w-11 h-11 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] text-lg font-semibold">
        {displayIcon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">{topic.title}</span>
          {topic.category && (
            <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: topic.category.color || 'var(--accent)' }} title={topic.category.name} />
          )}
        </span>
        <span className="block text-xs text-[var(--muted)] truncate mt-0.5">{summary}</span>
        {topic.description && meta.length > 0 && (
          <span className="block text-[11px] text-[var(--muted)]/80 truncate mt-0.5">{meta.join(' · ')}</span>
        )}
      </span>
      <ChevronRight size={16} className="shrink-0 text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all" />
    </Link>
  )
}
