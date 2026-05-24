'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Pencil, Trash2, FileText } from 'lucide-react'

type Post = {
  id: string
  title: string
  slug: string
  published: boolean
  publishedAt: Date | null
  createdAt: Date
}

export default function PostTable({ posts }: { posts: Post[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = q
    ? posts.filter((p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q))
    : posts

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return
    await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <SearchInput value={query} onChange={setQuery} placeholder="Search posts…" />

      {filtered.length === 0 ? (
        <EmptyState query={query} />
      ) : (
        <>
          {/* Mobile: card list */}
          <ul className="sm:hidden space-y-2">
            {filtered.map((post) => (
              <li
                key={post.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
              >
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="row-pressable block px-4 pt-4 pb-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 mt-0.5 w-10 h-10 rounded-xl bg-[var(--background)] flex items-center justify-center text-[var(--accent)]">
                      <FileText size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[var(--foreground)] truncate">
                        {post.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <StatusPill published={post.published} />
                        <span className="text-xs text-[var(--muted)]">
                          {formatDate(post.publishedAt ?? post.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="flex border-t border-[var(--border)] divide-x divide-[var(--border)]">
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="row-pressable flex-1 h-11 flex items-center justify-center gap-1.5 text-sm font-medium text-[var(--accent)]"
                  >
                    <Pencil size={15} />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id, post.title)}
                    className="row-pressable flex-1 h-11 flex items-center justify-center gap-1.5 text-sm font-medium text-red-500"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden sm:block rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                  <th className="text-left px-4 py-3 text-[var(--muted)] font-medium">Title</th>
                  <th className="text-left px-4 py-3 text-[var(--muted)] font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-[var(--muted)] font-medium">Date</th>
                  <th className="text-right px-4 py-3 text-[var(--muted)] font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)] transition-colors"
                  >
                    <td className="px-4 py-3 text-[var(--foreground)]">{post.title}</td>
                    <td className="px-4 py-3">
                      <StatusPill published={post.published} />
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {formatDate(post.publishedAt ?? post.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-3 justify-end">
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className="text-[var(--accent)] hover:underline"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="text-red-400 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function StatusPill({ published }: { published: boolean }) {
  return (
    <span
      className={`text-[11px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${
        published
          ? 'bg-green-500/15 text-green-500'
          : 'bg-[var(--border)] text-[var(--muted)]'
      }`}
    >
      {published ? 'Published' : 'Draft'}
    </span>
  )
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="relative">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-9 pr-3 text-sm rounded-2xl sm:rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
      />
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  if (query) {
    return (
      <div className="text-center py-12 text-[var(--muted)] text-sm">
        No posts match &ldquo;{query}&rdquo;.
      </div>
    )
  }
  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] mb-3">
        <FileText size={26} />
      </div>
      <p className="text-[var(--foreground)] font-medium">No posts yet</p>
      <p className="text-sm text-[var(--muted)] mt-1 mb-4">Create your first blog post.</p>
      <Link
        href="/admin/posts/new"
        className="tap-scale inline-flex items-center h-10 px-4 rounded-full bg-[var(--accent)] text-white text-sm font-medium"
      >
        Create post
      </Link>
    </div>
  )
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
