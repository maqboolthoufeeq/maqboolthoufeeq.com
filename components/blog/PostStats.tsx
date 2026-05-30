import { Eye, Zap, Lock } from 'lucide-react'

/**
 * Compact per-post analytics shown near the top of a blog post.
 * `adminOnly` is true when the public toggle is off but an admin is viewing —
 * in that case a small lock hint clarifies the stats aren't public.
 */
export default function PostStats({
  views,
  zaps,
  adminOnly = false,
}: {
  views: number
  zaps: number
  adminOnly?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--muted)]">
        <Eye size={13} className="shrink-0" />
        <span className="tabular-nums text-[var(--foreground)]">{views.toLocaleString('en-US')}</span>
        {views === 1 ? 'view' : 'views'}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--muted)]">
        <Zap size={13} className="shrink-0" />
        <span className="tabular-nums text-[var(--foreground)]">{zaps.toLocaleString('en-US')}</span>
        {zaps === 1 ? 'zap' : 'zaps'}
      </span>
      {adminOnly && (
        <span
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]"
          title="Only visible to you — turn on “Show stats on blog posts” in Analytics to make these public."
        >
          <Lock size={11} className="shrink-0" />
          Only you
        </span>
      )}
    </div>
  )
}
