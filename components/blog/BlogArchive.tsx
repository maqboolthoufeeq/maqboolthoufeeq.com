'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'

type ArchivePost = {
  slug: string
  title: string
  publishedAt: string
}

type MonthGroup = {
  month: number
  label: string
  posts: ArchivePost[]
}

type YearGroup = {
  year: number
  months: MonthGroup[]
}

function buildArchive(posts: ArchivePost[]): YearGroup[] {
  const map = new Map<number, Map<number, ArchivePost[]>>()
  for (const post of posts) {
    const d = new Date(post.publishedAt)
    const y = d.getFullYear()
    const m = d.getMonth()
    if (!map.has(y)) map.set(y, new Map())
    const mMap = map.get(y) as Map<number, ArchivePost[]>
    if (!mMap.has(m)) mMap.set(m, [])
    ;(mMap.get(m) as ArchivePost[]).push(post)
  }

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, mMap]) => ({
      year,
      months: [...mMap.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([month, ps]) => ({ month, label: MONTHS[month], posts: ps })),
    }))
}

function MonthRow({ group }: { group: MonthGroup }) {
  const [open, setOpen] = useState(false)
  return (
    <li>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 w-full text-left py-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {group.label}
        <span className="ml-auto text-xs opacity-60">{group.posts.length}</span>
      </button>
      {open && (
        <ul className="ml-4 border-l border-[var(--border)] pl-3 space-y-1 pb-1">
          {group.posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors line-clamp-1"
              >
                {post.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function YearRow({ group }: { group: YearGroup }) {
  const [open, setOpen] = useState(true)
  const total = group.months.reduce((s, m) => s + m.posts.length, 0)
  return (
    <li>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 w-full text-left py-1.5 font-semibold text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors cursor-pointer"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {group.year}
        <span className="ml-auto text-xs font-normal text-[var(--muted)]">{total}</span>
      </button>
      {open && (
        <ul className="ml-2">
          {group.months.map((m) => (
            <MonthRow key={m.month} group={m} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function BlogArchive({ posts }: { posts: ArchivePost[] }) {
  const archive = buildArchive(posts)
  if (archive.length === 0) return null

  return (
    <aside className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3 uppercase tracking-wide">Archive</h2>
      <ul className="space-y-0.5">
        {archive.map((y) => (
          <YearRow key={y.year} group={y} />
        ))}
      </ul>
    </aside>
  )
}
