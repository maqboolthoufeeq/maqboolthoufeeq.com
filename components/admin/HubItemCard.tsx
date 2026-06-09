'use client'

import { type ComponentType, useState } from 'react'
import {
  AlertCircle, CheckCircle2, ChevronUp, ChevronDown, ChevronDown as ChevronDownIcon, Loader2, Trash2, Upload,
  Link as LinkIcon, Type as TypeIcon, Hash as HashIcon, FileText as FileTextIcon,
  Image as ImageIcon, Video as VideoIcon, Music as MusicIcon, Download as DownloadIcon,
  Code as CodeIcon, FileType as FileTypeIcon,
} from 'lucide-react'
import { HUB_ITEM_META, HUB_LIMITS, parseHubEmbed } from '@/lib/hub-content'
import type { HubItemData, HubCategoryRef } from '@/lib/hub'
import Switch from '@/components/admin/Switch'
import TagSelector from '@/components/admin/TagSelector'
import Editor from '@/components/admin/Editor'

const inputCls =
  'w-full h-11 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm'

/** A single content-block form-row item. */
export type FormItem = HubItemData & {
  localId?: string
  uploadProgress?: number
}

export default function ItemCard({
  item,
  index,
  total,
  expanded,
  onToggleExpand,
  onUpdate,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
  isSaving,
  categories,
  onUploadFile,
}: {
  item: FormItem
  index: number
  total: number
  expanded: boolean
  onToggleExpand: () => void
  onUpdate: (updates: Partial<FormItem>) => void
  onSave: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isSaving: boolean
  categories: HubCategoryRef[]
  onUploadFile: (file: File, itemId: string) => Promise<{ url: string; name: string; size: number; type: string } | null>
}) {
  const meta = HUB_ITEM_META[item.type]

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {/* Header — a clickable row (not a <button>, so the move controls below can
          be real buttons without invalid button-in-button nesting). */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleExpand() } }}
        aria-expanded={expanded}
        className="w-full flex items-center gap-3 px-3 py-3 hover:bg-[var(--background)]/50 transition-colors cursor-pointer select-none"
      >
        <div className="flex flex-col gap-1">
          <button type="button" aria-label="Move up" onClick={(e) => { e.stopPropagation(); onMoveUp() }} disabled={index === 0} className="text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-20 h-5 flex items-center">
            <ChevronUp size={16} />
          </button>
          <button type="button" aria-label="Move down" onClick={(e) => { e.stopPropagation(); onMoveDown() }} disabled={index === total - 1} className="text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-20 h-5 flex items-center">
            <ChevronDown size={16} />
          </button>
        </div>
        <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shrink-0">
          {getIconComponent(meta.icon, 18)}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-medium text-[var(--foreground)] truncate">{item.title || `Untitled ${meta.label}`}</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">{meta.label}</p>
        </div>
        <ChevronDownIcon size={18} className={`text-[var(--muted)] transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-[var(--border)]">
          {/* Title */}
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1.5">Title *</label>
            <input
              value={item.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Block title"
              maxLength={HUB_LIMITS.title}
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1.5">Description</label>
            <textarea
              value={item.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value || null })}
              placeholder="Optional description"
              maxLength={HUB_LIMITS.description}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm resize-y"
            />
          </div>

          {/* Type-specific fields */}
          <ItemTypeFields
            item={item}
            onUpdate={onUpdate}
            onUploadFile={onUploadFile}
          />

          {/* Category */}
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1.5">Category</label>
            <select
              value={item.category?.id || ''}
              onChange={(e) => {
                const cat = categories.find((c) => c.id === e.target.value)
                onUpdate({ category: cat || null })
              }}
              className={inputCls}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1.5">Tags</label>
            <TagSelector
              selectedIds={(item.tags ?? []).map((t) => t.id)}
              onChange={(ids) => {
                // TagSelector emits tag ids; keep minimal refs (name/slug refresh
                // from the server response after save).
                onUpdate({ tags: ids.map((id) => ({ id, name: '', slug: '' })) })
              }}
            />
          </div>

          {/* Date toggle + date input */}
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)]">Show date</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {item.date ? 'Date is visible' : 'Date is hidden'}
                </p>
              </div>
              <Switch
                checked={!!item.date}
                onChange={(v) => {
                  if (v && !item.date) {
                    onUpdate({ date: new Date().toISOString().slice(0, 10) })
                  } else if (!v) {
                    onUpdate({ date: null })
                  }
                }}
                label="Show date"
              />
            </div>
            {item.date && (
              <div className="mt-3">
                <label className="block text-xs text-[var(--muted)] mb-1.5">Date</label>
                <input
                  type="date"
                  value={item.date ? item.date.slice(0, 10) : ''}
                  onChange={(e) => onUpdate({ date: e.target.value })}
                  max={new Date().toISOString().slice(0, 10)}
                  className={`${inputCls} max-w-[200px]`}
                />
              </div>
            )}
          </div>

          {/* Published toggle */}
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)]">Published</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {item.published ? 'Visible on the site' : 'Only visible to you'}
                </p>
              </div>
              <Switch
                checked={item.published}
                onChange={(v) => onUpdate({ published: v })}
                label="Published"
              />
            </div>
          </div>

          {/* Save / Delete buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onSave}
              disabled={isSaving}
              className={`flex-1 h-10 rounded-lg font-medium transition-all text-white flex items-center justify-center gap-1.5 ${
                isSaving ? 'bg-[var(--accent)] opacity-50' : 'bg-[var(--accent)] hover:opacity-90'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving…
                </>
              ) : (
                'Save block'
              )}
            </button>
            <button
              onClick={onDelete}
              className="w-10 h-10 rounded-lg border border-red-500 text-red-500 hover:bg-red-500/10 transition-colors flex items-center justify-center"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ItemTypeFields({
  item,
  onUpdate,
  onUploadFile,
}: {
  item: FormItem
  onUpdate: (updates: Partial<FormItem>) => void
  onUploadFile: (file: File, itemId: string) => Promise<{ url: string; name: string; size: number; type: string } | null>
}) {
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, field: 'fileUrl' | 'url') {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const result = await onUploadFile(file, item.id)
    if (result) {
      if (field === 'fileUrl') {
        onUpdate({
          fileUrl: result.url,
          fileName: result.name,
          fileSize: result.size,
          fileType: result.type,
        })
      } else {
        onUpdate({ url: result.url })
      }
    }
    setUploading(false)
    e.target.value = ''
  }

  const supportsFile = ['image', 'video', 'audio', 'pdf', 'file'].includes(item.type)
  const supportsUrl = ['link', 'embed', 'image', 'video', 'audio', 'pdf'].includes(item.type)

  return (
    <>
      {item.type === 'link' && (
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1.5">URL *</label>
          <input
            value={item.url || ''}
            onChange={(e) => onUpdate({ url: e.target.value })}
            placeholder="https://example.com"
            maxLength={HUB_LIMITS.url}
            className={inputCls}
          />
        </div>
      )}

      {item.type === 'text' && (
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1.5">Content *</label>
          <textarea
            value={item.content || ''}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="Plain text…"
            maxLength={HUB_LIMITS.content}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm resize-y font-mono"
          />
        </div>
      )}

      {item.type === 'markdown' && (
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1.5">Markdown *</label>
          <textarea
            value={item.content || ''}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="# Heading\n\n**Bold** text…"
            maxLength={HUB_LIMITS.content}
            rows={6}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] text-sm resize-y font-mono text-xs"
          />
        </div>
      )}

      {item.type === 'richtext' && (
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1.5">Rich text *</label>
          <Editor
            content={item.content || ''}
            onChange={(html) => onUpdate({ content: html })}
          />
        </div>
      )}

      {supportsFile && (
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1.5">
            {item.type === 'pdf' || item.type === 'file' ? 'File' : 'Upload'} *
          </label>
          <div className="flex gap-2 items-stretch">
            <input
              value={item.fileUrl || ''}
              onChange={(e) => onUpdate({ fileUrl: e.target.value })}
              placeholder="https://… or upload"
              className={`${inputCls} flex-1`}
            />
            <label className="tap-scale cursor-pointer px-3 h-11 text-sm border border-[var(--border)] rounded-lg text-[var(--muted)] flex items-center gap-1.5 hover:border-[var(--accent)] hover:text-[var(--foreground)] transition-colors whitespace-nowrap">
              <Upload size={15} />
              {uploading ? '…' : 'Upload'}
              <input
                type="file"
                accept={
                  item.type === 'image' ? 'image/*'
                    : item.type === 'video' ? 'video/*'
                      : item.type === 'audio' ? 'audio/*'
                        : item.type === 'pdf' ? 'application/pdf'
                          : '*'
                }
                className="hidden"
                onChange={(e) => handleFileChange(e, 'fileUrl')}
              />
            </label>
          </div>
          {item.fileName && (
            <p className="text-xs text-green-500 mt-1">
              <CheckCircle2 size={12} className="inline mr-1" />
              {item.fileName}
            </p>
          )}
        </div>
      )}

      {supportsUrl && !['pdf', 'file'].includes(item.type) && (
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1.5">
            {item.type === 'image' || item.type === 'video' ? 'External URL' : 'URL'}
          </label>
          <input
            value={item.url || ''}
            onChange={(e) => onUpdate({ url: e.target.value })}
            placeholder={
              item.type === 'embed' ? 'YouTube, Vimeo, Spotify, Figma…'
                : item.type === 'image' ? 'https://… (optional if uploaded)'
                  : item.type === 'video' ? 'https://… or YouTube/Vimeo URL'
                    : 'https://…'
            }
            maxLength={HUB_LIMITS.url}
            className={inputCls}
          />
          {item.type === 'embed' && item.url && (
            <EmbedPreview url={item.url} />
          )}
        </div>
      )}

      {item.type === 'pdf' && (
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1.5">Thumbnail (optional)</label>
          <input
            value={item.thumbnail || ''}
            onChange={(e) => onUpdate({ thumbnail: e.target.value })}
            placeholder="https://…"
            maxLength={HUB_LIMITS.url}
            className={inputCls}
          />
        </div>
      )}

      {item.type === 'video' && (
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1.5">Thumbnail (optional)</label>
          <input
            value={item.thumbnail || ''}
            onChange={(e) => onUpdate({ thumbnail: e.target.value })}
            placeholder="https://…"
            maxLength={HUB_LIMITS.url}
            className={inputCls}
          />
        </div>
      )}
    </>
  )
}

function EmbedPreview({ url }: { url: string }) {
  const embed = parseHubEmbed(url)
  if (!embed) {
    return (
      <p className="text-xs text-red-500 mt-1">
        <AlertCircle size={12} className="inline mr-1" />
        Unsupported embed provider
      </p>
    )
  }
  return (
    <p className="text-xs text-green-500 mt-1">
      <CheckCircle2 size={12} className="inline mr-1" />
      {embed.provider}
    </p>
  )
}

const HUB_BLOCK_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  Link: LinkIcon,
  Type: TypeIcon,
  Hash: HashIcon,
  FileText: FileTextIcon,
  Image: ImageIcon,
  Video: VideoIcon,
  Music: MusicIcon,
  Download: DownloadIcon,
  Code: CodeIcon,
  FileType: FileTypeIcon,
}

export function getIconComponent(icon: string, size: number = 16) {
  const Icon = HUB_BLOCK_ICONS[icon] ?? FileTextIcon
  return <Icon size={size} />
}
