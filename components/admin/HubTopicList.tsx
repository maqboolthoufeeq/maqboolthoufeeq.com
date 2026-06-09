'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, Pencil, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Settings,
} from 'lucide-react'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import type { HubAdminTopicNode } from '@/lib/hub'

const inputCls =
  'w-full h-11 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm'

export default function HubTopicList({ tree }: { tree: HubAdminTopicNode[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  function filterTree(nodes: HubAdminTopicNode[], query: string): HubAdminTopicNode[] {
    const q = query.toLowerCase()
    const matches = nodes.filter((n) =>
      n.title.toLowerCase().includes(q) || n.children.length > 0
    )
    return matches.map((n) => ({
      ...n,
      children: filterTree(n.children, query),
    }))
  }

  const filtered = filterTree(tree, search)

  async function togglePublished(id: string, current: boolean) {
    const res = await fetch(`/api/hub/topics/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !current }),
    })
    if (res.ok) router.refresh()
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/hub/topics/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setDeleting(false)
      setPendingDelete(null)
    }
  }

  async function reorderSiblings(nodes: HubAdminTopicNode[], id: string, dir: -1 | 1) {
    const idx = nodes.findIndex((n) => n.id === id)
    if (idx === -1) return
    const target = idx + dir
    if (target < 0 || target >= nodes.length) return
    const reordered = [...nodes]
    ;[reordered[idx], reordered[target]] = [reordered[target], reordered[idx]]
    const res = await fetch('/api/hub/topics/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: reordered.map((n) => n.id) }),
    })
    if (res.ok) router.refresh()
  }

  const deleteTarget = filtered.flatMap((n) => [n, ...flatten(n.children)]).find((n) => n.id === pendingDelete)

  function flatten(nodes: HubAdminTopicNode[]): HubAdminTopicNode[] {
    return nodes.flatMap((n) => [n, ...flatten(n.children)])
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics…"
            className={inputCls}
          />
        </div>
        <Link
          href="/admin/hub/new"
          className="tap-scale h-11 px-4 bg-[var(--accent)] text-white rounded-xl hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 font-medium whitespace-nowrap"
        >
          <Plus size={16} strokeWidth={2.4} />
          <span className="hidden sm:inline">New topic</span>
        </Link>
        <Link
          href="/admin/hub/categories"
          aria-label="Manage categories"
          className="tap-scale h-11 w-11 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] flex items-center justify-center transition-colors"
        >
          <Settings size={18} />
        </Link>
      </div>

      {/* Tree */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 px-4">
          <p className="text-[var(--muted)] text-sm">
            {search ? 'No topics match your search.' : 'No topics yet. Create one to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <TopicTreeNodes
            nodes={filtered}
            allNodes={tree}
            onReorder={reorderSiblings}
            onTogglePublished={togglePublished}
            onDelete={setPendingDelete}
          />
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        busy={deleting}
        title={`Delete "${deleteTarget?.title || ''}"?`}
        message={
          deleteTarget && (deleteTarget.childCount > 0 || deleteTarget.itemCount > 0)
            ? `This topic has ${deleteTarget.childCount > 0 ? `${deleteTarget.childCount} subtopic(s)` : ''}${deleteTarget.childCount > 0 && deleteTarget.itemCount > 0 ? ' and ' : ''}${deleteTarget.itemCount > 0 ? `${deleteTarget.itemCount} item(s)` : ''}. All will be deleted.`
            : 'This topic will be permanently deleted.'
        }
        confirmLabel="Delete topic"
        onConfirm={() => { if (pendingDelete) handleDelete(pendingDelete) }}
        onCancel={() => { if (!deleting) setPendingDelete(null) }}
      />
    </div>
  )
}

function TopicTreeNodes({
  nodes,
  allNodes,
  onReorder,
  onTogglePublished,
  onDelete,
  depth = 0,
}: {
  nodes: HubAdminTopicNode[]
  allNodes: HubAdminTopicNode[]
  onReorder: (siblings: HubAdminTopicNode[], id: string, dir: -1 | 1) => void
  onTogglePublished: (id: string, current: boolean) => void
  onDelete: (id: string) => void
  depth?: number
}) {
  return (
    <ul className="space-y-2">
      {nodes.map((node, idx) => (
        <li key={node.id}>
          <TopicRow
            node={node}
            depth={depth}
            index={idx}
            total={nodes.length}
            onReorder={(dir) => onReorder(nodes, node.id, dir)}
            onTogglePublished={() => onTogglePublished(node.id, node.published)}
            onDelete={() => onDelete(node.id)}
          />
          {node.children.length > 0 && (
            <div className="mt-1">
              <TopicTreeNodes
                nodes={node.children}
                allNodes={allNodes}
                onReorder={onReorder}
                onTogglePublished={onTogglePublished}
                onDelete={onDelete}
                depth={depth + 1}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

function TopicRow({
  node,
  depth,
  index,
  total,
  onReorder,
  onTogglePublished,
  onDelete,
}: {
  node: HubAdminTopicNode
  depth: number
  index: number
  total: number
  onReorder: (dir: -1 | 1) => void
  onTogglePublished: () => void
  onDelete: () => void
}) {
  const paddingLeft = `${depth * 2}rem`

  return (
    <div
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
      style={{ marginLeft: depth > 0 ? '0.5rem' : '0' }}
    >
      <div className="flex items-center gap-3 px-3 py-3" style={{ paddingLeft }}>
        {/* Reorder */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onReorder(-1)}
            disabled={index === 0}
            aria-label="Move up"
            className="text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-20 h-5 flex items-center"
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={() => onReorder(1)}
            disabled={index === total - 1}
            aria-label="Move down"
            className="text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-20 h-5 flex items-center"
          >
            <ChevronDown size={16} />
          </button>
        </div>

        {/* Title + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-[var(--foreground)] truncate">{node.title}</p>
            {!node.published && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600">
                Draft
              </span>
            )}
            {node.childCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                {node.childCount} sub
              </span>
            )}
            {node.itemCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                {node.itemCount} item{node.itemCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {node.category && (
            <p className="text-xs text-[var(--muted)] mt-0.5">{node.category.name}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onTogglePublished}
            aria-label={node.published ? 'Hide' : 'Show'}
            title={node.published ? 'Published' : 'Draft'}
            className="tap-scale p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            {node.published ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <Link
            href={`/admin/hub/${node.id}/edit`}
            aria-label="Edit"
            className="tap-scale p-1.5 rounded-lg text-[var(--accent)] hover:bg-[var(--background)]"
          >
            <Pencil size={16} />
          </Link>
          <button
            onClick={onDelete}
            aria-label="Delete"
            className="tap-scale p-1.5 rounded-lg text-red-500 hover:bg-[var(--background)]"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
