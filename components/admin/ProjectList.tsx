'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  PointerSensor,
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

type Project = {
  id: string
  title: string
  featured: boolean
  order: number
}

function SortableRow({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: project.id })

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)] transition-colors"
    >
      <td className="px-4 py-3">
        <button {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing text-[var(--muted)] mr-2" aria-label="Drag to reorder">⠿</button>
        <span className="text-[var(--foreground)]">{project.title}</span>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className={`text-xs px-2 py-0.5 rounded-full ${project.featured ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-[var(--border)] text-[var(--muted)]'}`}>
          {project.featured ? 'Featured' : 'Hidden'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex gap-3 justify-end">
          <Link href={`/admin/projects/${project.id}/edit`} className="text-[var(--accent)] hover:underline text-sm">Edit</Link>
          <button onClick={() => onDelete(project.id)} className="text-red-400 hover:underline text-sm">Delete</button>
        </div>
      </td>
    </tr>
  )
}

const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]'

export default function ProjectList({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [query, setQuery] = useState('')
  const router = useRouter()

  const sensors = useSensors(useSensor(PointerSensor))

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
        })
      )
    )
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this project?')) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    setProjects((prev) => prev.filter((p) => p.id !== id))
    router.refresh()
  }

  const tableHead = (
    <thead>
      <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
        <th className="text-left px-4 py-3 text-[var(--muted)] font-medium">Title</th>
        <th className="text-left px-4 py-3 text-[var(--muted)] font-medium hidden sm:table-cell">Status</th>
        <th className="text-right px-4 py-3 text-[var(--muted)] font-medium">Actions</th>
      </tr>
    </thead>
  )

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search projects…"
        className={inputCls}
      />

      {projects.length === 0 ? (
        <p className="text-[var(--muted)] text-sm">
          No projects yet.{' '}
          <Link href="/admin/projects/new" className="text-[var(--accent)] hover:underline">Add one →</Link>
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-[var(--muted)] text-sm">No projects match "{query}".</p>
      ) : q ? (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            {tableHead}
            <tbody>
              {filtered.map((project) => (
                <tr key={project.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)] transition-colors">
                  <td className="px-4 py-3 text-[var(--foreground)]">{project.title}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${project.featured ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'bg-[var(--border)] text-[var(--muted)]'}`}>
                      {project.featured ? 'Featured' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-3 justify-end">
                      <Link href={`/admin/projects/${project.id}/edit`} className="text-[var(--accent)] hover:underline text-sm">Edit</Link>
                      <button onClick={() => handleDelete(project.id)} className="text-red-400 hover:underline text-sm">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              {tableHead}
              <tbody>
                <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                  {projects.map((project) => (
                    <SortableRow key={project.id} project={project} onDelete={handleDelete} />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </div>
        </DndContext>
      )}
    </div>
  )
}
