import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getHubLanding } from '@/lib/hub'
import { getSiteContent } from '@/lib/site-content'

const SERIF = { fontFamily: 'var(--font-lora), serif' }
const PREVIEW_LIMIT = 5

/**
 * Landing-page preview of the Link Hub: the hub heading/subtitle plus the first
 * few top-level topics as editorial rows, linking through to the full `/hub`.
 * Renders nothing when there's no published hub content, so it's safe to leave
 * enabled on a fresh site. Toggle it in Admin → Landing page → Link hub.
 */
export default async function HubPreview() {
  const [data, hub] = await Promise.all([getHubLanding(), getSiteContent('hub')])
  const topics = data.topics.slice(0, PREVIEW_LIMIT)

  if (topics.length === 0) return null

  return (
    <section id="hub" className="max-w-5xl mx-auto px-4 py-20">
      <div className="flex items-end justify-between gap-4 mb-2">
        <h2 className="text-2xl font-bold text-[var(--foreground)]">{hub.title || 'Hub'}</h2>
        <Link href="/hub" className="shrink-0 text-sm text-[var(--accent)] hover:underline">
          Explore the hub →
        </Link>
      </div>
      <div className="w-10 h-0.5 bg-[var(--accent)] mb-6" />

      {hub.subtitle && (
        <p className="text-[15px] text-[var(--muted)] leading-relaxed mb-6 max-w-xl">{hub.subtitle}</p>
      )}

      <ul>
        {topics.map((topic, index) => {
          const meta: string[] = []
          if (topic.childCount > 0) meta.push(`${topic.childCount} subtopic${topic.childCount === 1 ? '' : 's'}`)
          if (topic.itemCount > 0) meta.push(`${topic.itemCount} item${topic.itemCount === 1 ? '' : 's'}`)
          const metaText = meta.join(' · ') || 'Empty'

          return (
            <li key={topic.id} className="border-b border-[var(--border)]">
              <Link
                href={`/hub/${topic.slug}`}
                className="group row-pressable flex items-start gap-4 py-4"
              >
                <span className="shrink-0 w-7 text-sm tabular-nums text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors pt-1.5">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {topic.coverImage && (
                  <img
                    src={topic.coverImage}
                    alt=""
                    loading="lazy"
                    className="shrink-0 self-center w-11 h-11 rounded-lg object-cover border border-[var(--border)]"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    {topic.icon && <span className="shrink-0 text-base leading-none">{topic.icon}</span>}
                    <span
                      className="text-lg sm:text-xl font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors"
                      style={SERIF}
                    >
                      {topic.title}
                    </span>
                    {topic.category && (
                      <span
                        className="shrink-0 w-1.5 h-1.5 rounded-full"
                        style={{ background: topic.category.color || 'var(--accent)' }}
                        title={topic.category.name}
                      />
                    )}
                  </span>
                  <span className="block text-xs sm:text-sm text-[var(--muted)] truncate mt-1">
                    {topic.description || metaText}
                  </span>
                </span>
                <span className="shrink-0 self-center pt-0.5">
                  <ArrowRight
                    size={17}
                    className="text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all"
                  />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
