import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { HubTopicSummary } from '@/lib/hub'

const SERIF = { fontFamily: 'var(--font-lora), serif' }

/**
 * A hub topic as an editorial, numbered row: running index, a serif headline,
 * a one-line summary and a right-aligned meta column. Rule-separated, no cards.
 */
export function HubTopicCard({ topic, index }: { topic: HubTopicSummary; index?: number }) {
  const meta: string[] = []
  if (topic.childCount > 0) meta.push(`${topic.childCount} subtopic${topic.childCount === 1 ? '' : 's'}`)
  if (topic.itemCount > 0) meta.push(`${topic.itemCount} item${topic.itemCount === 1 ? '' : 's'}`)
  const metaText = meta.join(' · ') || 'Empty'

  return (
    <Link href={`/hub/${topic.slug}`} className="group flex items-start gap-4 py-4 border-b border-[var(--border)]">
      {index != null && (
        <span className="shrink-0 w-7 text-sm tabular-nums text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors pt-1.5">{String(index + 1).padStart(2, '0')}</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          {topic.icon && <span className="shrink-0 text-base leading-none">{topic.icon}</span>}
          <span className="text-lg sm:text-xl font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors" style={SERIF}>{topic.title}</span>
          {topic.category && <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: topic.category.color || 'var(--accent)' }} title={topic.category.name} />}
        </span>
        <span className="block text-xs sm:text-sm text-[var(--muted)] truncate mt-1">{topic.description || metaText}</span>
      </span>
      <span className="hidden sm:flex shrink-0 items-center self-center gap-3 text-xs text-[var(--muted)] tabular-nums">
        {topic.description && meta.length > 0 ? metaText : ''}
      </span>
      <ArrowRight size={17} className="shrink-0 self-center text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all" />
    </Link>
  )
}
