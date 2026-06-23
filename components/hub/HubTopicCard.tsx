'use client'

import Link from 'next/link'
import { ArrowRight, Pencil, Trash2 } from 'lucide-react'
import type { HubTopicSummary } from '@/lib/hub'
import { useHubAdmin } from './hub-admin'

const SERIF = { fontFamily: 'var(--font-lora), serif' }

/**
 * A hub topic as an editorial, numbered row: running index, a serif headline,
 * a one-line summary and a right-aligned meta column. Rule-separated, no cards.
 * In admin edit mode, inline edit/delete controls replace the chevron.
 */
export function HubTopicCard({ topic, index }: { topic: HubTopicSummary; index?: number }) {
  const admin = useHubAdmin()
  const showControls = !!admin?.isAdmin && admin.editMode

  const meta: string[] = []
  if (topic.childCount > 0) meta.push(`${topic.childCount} subtopic${topic.childCount === 1 ? '' : 's'}`)
  if (topic.itemCount > 0) meta.push(`${topic.itemCount} item${topic.itemCount === 1 ? '' : 's'}`)
  const metaText = meta.join(' · ') || 'Empty'
  const cascades = topic.childCount > 0 || topic.itemCount > 0

  return (
    <div className="relative group border-b border-[var(--border)]">
      <Link href={`/hub/${topic.slug}`} className="flex items-start gap-4 py-4">
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
        {/* Reserve space on the right so the absolute controls don't overlap text */}
        <span className={`shrink-0 self-center ${showControls ? 'w-[68px]' : 'w-[17px]'}`} aria-hidden>
          {!showControls && <ArrowRight size={17} className="text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all" />}
        </span>
      </Link>

      {showControls && admin && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => admin.editTopic(topic.id)}
            aria-label={`Edit ${topic.title}`}
            className="tap-scale w-9 h-9 flex items-center justify-center rounded-lg text-[var(--accent)] hover:bg-[var(--surface)]"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => admin.deleteTopic(topic.id, topic.title, cascades)}
            aria-label={`Delete ${topic.title}`}
            className="tap-scale w-9 h-9 flex items-center justify-center rounded-lg text-red-500 hover:bg-[var(--surface)]"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
