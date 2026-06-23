'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check } from 'lucide-react'
import Modal from '@/components/admin/Modal'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import HubTopicForm from '@/components/admin/HubTopicForm'
import HubItemEditor from '@/components/admin/HubItemEditor'
import type { HubCategoryRef, HubItemData, HubTopicEditData } from '@/lib/hub'

type TopicOption = { id: string; title: string; depth: number; parentId: string | null }

interface HubAdminApi {
  isAdmin: boolean
  editMode: boolean
  /** Open the "new topic" modal, optionally nested under `parentId`. */
  createTopic: (parentId?: string | null) => void
  /** Open the "edit topic" modal (fetches the editable shape on demand). */
  editTopic: (id: string) => void
  /** Open the delete confirmation for a topic (cascades to its subtree). */
  deleteTopic: (id: string, title: string, cascades?: boolean) => void
  /** Open the content-blocks editor for a topic. */
  manageItems: (topicId: string, title: string, items: HubItemData[]) => void
}

const Ctx = createContext<HubAdminApi | null>(null)

/** Read the hub-admin API from any descendant of HubAdminProvider (null otherwise). */
export function useHubAdmin(): HubAdminApi | null {
  return useContext(Ctx)
}

type ModalState =
  | { kind: 'create-topic'; parentId: string | null }
  | { kind: 'edit-topic'; id: string }
  | { kind: 'items'; topicId: string; title: string; items: HubItemData[] }
  | null

/**
 * Wraps the public hub UI to let a logged-in admin add/edit/delete topics,
 * subtopics and content blocks inline — via modals — without leaving the page.
 * A floating toggle flips "edit mode" on/off; descendants read state through
 * `useHubAdmin()` and render their own controls. Renders nothing extra for
 * visitors (when `isAdmin` is false).
 */
export default function HubAdminProvider({ isAdmin, categories, topicOptions, children }: {
  isAdmin: boolean
  categories: HubCategoryRef[]
  topicOptions: TopicOption[]
  children: React.ReactNode
}) {
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const [modal, setModal] = useState<ModalState>(null)

  // Persist edit mode across navigations + reloads (client-only to avoid a
  // hydration mismatch on the toggle's label/state).
  useEffect(() => {
    if (localStorage.getItem('hub-edit-mode') === '1') setEditMode(true)
  }, [])
  const toggleEditMode = useCallback(() => {
    setEditMode((v) => {
      const next = !v
      localStorage.setItem('hub-edit-mode', next ? '1' : '0')
      return next
    })
  }, [])

  const [editData, setEditData] = useState<HubTopicEditData | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [confirm, setConfirm] = useState<{ id: string; title: string; cascades: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const createTopic = useCallback((parentId: string | null = null) => {
    setModal({ kind: 'create-topic', parentId })
  }, [])

  const editTopic = useCallback(async (id: string) => {
    setModal({ kind: 'edit-topic', id })
    setEditData(null)
    setLoadingEdit(true)
    setError('')
    try {
      const res = await fetch(`/api/hub/topics/${id}/edit`)
      if (res.ok) setEditData(await res.json())
      else setError('Failed to load topic.')
    } catch {
      setError('Failed to load topic.')
    } finally {
      setLoadingEdit(false)
    }
  }, [])

  const manageItems = useCallback((topicId: string, title: string, items: HubItemData[]) => {
    setModal({ kind: 'items', topicId, title, items })
  }, [])

  const deleteTopic = useCallback((id: string, title: string, cascades = false) => {
    setConfirm({ id, title, cascades })
  }, [])

  async function doDelete() {
    if (!confirm) return
    setBusy(true)
    try {
      const res = await fetch(`/api/hub/topics/${confirm.id}`, { method: 'DELETE' })
      if (res.ok) router.refresh()
    } finally {
      setBusy(false)
      setConfirm(null)
    }
  }

  const closeModal = useCallback(() => { setModal(null); setEditData(null) }, [])

  const api: HubAdminApi = { isAdmin, editMode, createTopic, editTopic, deleteTopic, manageItems }
  const topicModalOpen = modal?.kind === 'create-topic' || modal?.kind === 'edit-topic'

  return (
    <Ctx.Provider value={api}>
      {children}

      {isAdmin && (
        <button
          type="button"
          onClick={toggleEditMode}
          aria-pressed={editMode}
          className={`fixed bottom-5 right-5 z-[70] tap-scale inline-flex items-center gap-2 h-11 px-4 rounded-full shadow-lg font-medium text-sm print:hidden transition-colors ${
            editMode
              ? 'bg-[var(--foreground)] text-[var(--background)]'
              : 'bg-[var(--accent)] text-white hover:opacity-90'
          }`}
        >
          {editMode ? <Check size={17} strokeWidth={2.4} /> : <Pencil size={16} strokeWidth={2.2} />}
          {editMode ? 'Done editing' : 'Edit hub'}
        </button>
      )}

      {/* Create / edit a topic */}
      <Modal
        open={topicModalOpen}
        title={modal?.kind === 'edit-topic' ? 'Edit topic' : modal?.kind === 'create-topic' && modal.parentId ? 'Add subtopic' : 'Add topic'}
        onClose={closeModal}
      >
        {modal?.kind === 'create-topic' && (
          <HubTopicForm
            initial={null}
            topicOptions={topicOptions}
            categories={categories}
            defaultParentId={modal.parentId}
            onCreated={() => { closeModal(); router.refresh() }}
          />
        )}
        {modal?.kind === 'edit-topic' && (
          loadingEdit ? (
            <p className="py-8 text-center text-sm text-[var(--muted)]">Loading…</p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-red-500">{error}</p>
          ) : editData ? (
            <HubTopicForm initial={editData} topicOptions={topicOptions} categories={categories} />
          ) : null
        )}
      </Modal>

      {/* Manage a topic's content blocks */}
      <Modal
        open={modal?.kind === 'items'}
        title={`Content — ${modal?.kind === 'items' ? modal.title : ''}`}
        onClose={closeModal}
      >
        {modal?.kind === 'items' && (
          <HubItemEditor topicId={modal.topicId} initialItems={modal.items} categories={categories} />
        )}
      </Modal>

      <ConfirmDialog
        open={confirm !== null}
        busy={busy}
        title={`Delete "${confirm?.title ?? ''}"?`}
        message={confirm?.cascades
          ? 'This topic and all its subtopics and content blocks will be permanently deleted.'
          : 'This topic will be permanently deleted.'}
        confirmLabel="Delete"
        onConfirm={doDelete}
        onCancel={() => { if (!busy) setConfirm(null) }}
      />
    </Ctx.Provider>
  )
}
