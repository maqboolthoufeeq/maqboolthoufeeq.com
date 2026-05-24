'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Search, Pencil, Trash2, Folder, Star } from 'lucide-react'

type Project = {
  id: string
  title: string
  featured: boolean
  order: number
}

export default function ProjectList({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [query, setQuery] = useState('')
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  )

  const q = query.trim().toLowerCase()
  const filtered = q ? projects.filter((p) => p.title.toLowerCase().includes(q)) : projects

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = projects.findIndex((p) => p.id === active.id)
    const newIndex = projects.findIndex((p) => p.id === over.id)
    const reordered = arrayMove(projects, oldIndex, newIndex)
    setProjects(reordered)

    await Promise.all(
      reordered.map((p, i) =>
        fetch(`/api/projects/${p.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: i }),
        }),
      ),
    )
    router.refresh()
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    setProjects((prev) => prev.filter((p) => p.id !== id))
    router.refresh()
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-4">
        <SearchInput value={query} onChange={setQuery} placeholder="Search projects…" />
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <SearchInput value={query} onChange={setQuery} placeholder="Search projects…" />

      {filtered.length === 0 ? (
        <p className="text-[var(--muted)] text-sm text-center py-12">
          No projects match &ldquo;{query}&rdquo;.
        </p>
      ) : q ? (
        // Search mode: no drag-and-drop
        <>
          <ul className="sm:hidden space-y-2">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} onDelete={handleDelete} />
            ))}
          </ul>
          <div className="hidden sm:block rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <TableHead />
              <tbody>
                {filtered.map((project) => (
                  <ProjectRow key={project.id} project={project} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={projects.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="sm:hidden space-y-2">
              {projects.map((project) => (
                <SortableProjectCard
                  key={project.id}
                  project={project}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
            <div className="hidden sm:block rounded-xl border border-[var(--border)] overflow-hidden">
              <table className="w-full text-sm">
                <TableHead />
                <tbody>
                  {projects.map((project) => (
                    <SortableProjectRow
                      key={project.id}
                      project={project}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </SortableContext>
        </DndContext>
      )}

      {!q && projects.length > 1 && (
        <p className="text-xs text-[var(--muted)] text-center sm:text-left mt-2">
          Long-press and drag to reorder.
        </p>
      )}
    </div>
  )
}

/* ─── Mobile card ────────────────────────────────────────────────────────── */

function ProjectCard({
  project,
  onDelete,
  dragHandle,
  setNodeRef,
  style,
}: {
  project: Project
  onDelete: (id: string, title: string) => void
  dragHandle?: React.ReactNode
  setNodeRef?: (el: HTMLLIElement | null) => void
  style?: React.CSSProperties
}) {
  return (
    <li
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
    >
      <div className="flex items-stretch">
        {dragHandle}
        <Link
          href={`/admin/projects/${project.id}/edit`}
          className="row-pressable flex-1 flex items-center gap-3 min-w-0 py-3 pr-3"
        >
          <span className="shrink-0 w-10 h-10 rounded-xl bg-[var(--background)] flex items-center justify-center text-[var(--accent)]">
            <Folder size={18} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-semibold text-[var(--foreground)] truncate">
              {project.title}
            </span>
            <span className="flex items-center gap-1.5 mt-1">
              {project.featured ? (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-medium">
                  <Star size={11} className="fill-current" />
                  Featured
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--border)] text-[var(--muted)] font-medium">
                  Hidden
                </span>
              )}
            </span>
          </span>
        </Link>
      </div>
      <div className="flex border-t border-[var(--border)] divide-x divide-[var(--border)]">
        <Link
          href={`/admin/projects/${project.id}/edit`}
          className="row-pressable flex-1 h-11 flex items-center justify-center gap-1.5 text-sm font-medium text-[var(--accent)]"
        >
          <Pencil size={15} />
          Edit
        </Link>
        <button
          onClick={() => onDelete(project.id, project.title)}
          className="row-pressable flex-1 h-11 flex items-center justify-center gap-1.5 text-sm font-medium text-red-500"
        >
          <Trash2 size={15} />
          Delete
        </button>
      </div>
    </li>
  )
}

function SortableProjectCard({
  project,
  onDelete,
}: {
  project: Project
  onDelete: (id: string, title: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  })

  const handle = (
    <button
      {...listeners}
      {...attributes}
      aria-label="Drag to reorder"
      className="shrink-0 w-11 self-stretch flex items-center justify-center text-[var(--muted)] touch-none cursor-grab active:cursor-grabbing border-r border-[var(--border)]"
    >
      <GripVertical size={18} />
    </button>
  )

  return (
    <ProjectCard
      project={project}
      onDelete={onDelete}
      dragHandle={handle}
      setNodeRef={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
    />
  )
}

/* ─── Desktop table rows ─────────────────────────────────────────────────── */

function TableHead() {
  return (
    <thead>
      <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
        <th className="text-left px-4 py-3 text-[var(--muted)] font-medium">Title</th>
        <th className="text-left px-4 py-3 text-[var(--muted)] font-medium">Status</th>
        <th className="text-right px-4 py-3 text-[var(--muted)] font-medium">Actions</th>
      </tr>
    </thead>
  )
}

function ProjectRow({
  project,
  onDelete,
  dragHandle,
  setNodeRef,
  style,
}: {
  project: Project
  onDelete: (id: string, title: string) => void
  dragHandle?: React.ReactNode
  setNodeRef?: (el: HTMLTableRowElement | null) => void
  style?: React.CSSProperties
}) {
  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)] transition-colors"
    >
      <td className="px-4 py-3">
        <span className="flex items-center gap-2">
          {dragHandle}
          <span className="text-[var(--foreground)]">{project.title}</span>
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            project.featured
              ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
              : 'bg-[var(--border)] text-[var(--muted)]'
          }`}
        >
          {project.featured ? 'Featured' : 'Hidden'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex gap-3 justify-end">
          <Link
            href={`/admin/projects/${project.id}/edit`}
            className="text-[var(--accent)] hover:underline text-sm"
          >
            Edit
          </Link>
          <button
            onClick={() => onDelete(project.id, project.title)}
            className="text-red-400 hover:underline text-sm"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}

function SortableProjectRow({
  project,
  onDelete,
}: {
  project: Project
  onDelete: (id: string, title: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  })
  const handle = (
    <button
      {...listeners}
      {...attributes}
      aria-label="Drag to reorder"
      className="cursor-grab active:cursor-grabbing text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
    >
      <GripVertical size={16} />
    </button>
  )
  return (
    <ProjectRow
      project={project}
      onDelete={onDelete}
      dragHandle={handle}
      setNodeRef={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
    />
  )
}

/* ─── Shared ─────────────────────────────────────────────────────────────── */

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

function EmptyState() {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] mb-3">
        <Folder size={26} />
      </div>
      <p className="text-[var(--foreground)] font-medium">No projects yet</p>
      <p className="text-sm text-[var(--muted)] mt-1 mb-4">Add your first portfolio project.</p>
      <Link
        href="/admin/projects/new"
        className="tap-scale inline-flex items-center h-10 px-4 rounded-full bg-[var(--accent)] text-white text-sm font-medium"
      >
        Create project
      </Link>
    </div>
  )
}
