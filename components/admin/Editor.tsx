'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import { Node, mergeAttributes } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import { TextStyle, FontFamily, FontSize, Color } from '@tiptap/extension-text-style'

const VideoNode = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null, parseHTML: el => el.getAttribute('src') },
      style: { default: null, parseHTML: el => el.getAttribute('style') },
    }
  },
  parseHTML() { return [{ tag: 'video[src]' }] },
  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes({ controls: true }, HTMLAttributes)]
  },
})

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: { default: null, parseHTML: el => el.getAttribute('style') },
    }
  },
})

const FONTS = [
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Trebuchet', value: 'Trebuchet MS, sans-serif' },
  { label: 'Courier', value: 'Courier New, monospace' },
  { label: 'Mono', value: 'ui-monospace, monospace' },
  { label: 'Impact', value: 'Impact, sans-serif' },
]

const SIZES = [
  { label: 'XS', value: '12px' },
  { label: 'S', value: '14px' },
  { label: 'M', value: '16px' },
  { label: 'L', value: '20px' },
  { label: 'XL', value: '24px' },
]

const COLORS = [
  '#000000', '#6b7280', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899',
]

type Panel = 'link' | 'imgUrl' | 'ytUrl' | 'font' | 'size' | 'color' | null
type Pos = { top: number; left: number }
type Props = { content: string; onChange: (html: string) => void }

export default function Editor({ content, onChange }: Props) {
  const [mounted, setMounted] = useState(false)
  const [bubblePos, setBubblePos] = useState<Pos | null>(null)
  const [blockPos, setBlockPos] = useState<Pos | null>(null)
  const [blockOpen, setBlockOpen] = useState(false)
  const [panel, setPanel] = useState<Panel>(null)
  const [inputVal, setInputVal] = useState('')
  const [savedSel, setSavedSel] = useState<{ from: number; to: number } | null>(null)
  const imgFileRef = useRef<HTMLInputElement>(null)
  const vidFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => setMounted(true), [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      Placeholder.configure({ placeholder: 'Start writing…' }),
      ResizableImage,
      VideoNode,
      Youtube.configure({ controls: true }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
    ],
    content,
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    onSelectionUpdate: ({ editor: ed }) => {
      const { from, to, empty } = ed.state.selection

      if (!empty) {
        try {
          const s = ed.view.coordsAtPos(from)
          const e2 = ed.view.coordsAtPos(Math.max(from, to - 1))
          const left = Math.max(120, Math.min((s.left + e2.right) / 2, window.innerWidth - 120))
          setBubblePos({ top: s.top, left })
        } catch { setBubblePos(null) }
        setBlockPos(null)
        setBlockOpen(false)
      } else {
        setBubblePos(null)
        const { $from } = ed.state.selection
        if ($from.node().type.name === 'paragraph' && $from.node().textContent === '') {
          try {
            const coords = ed.view.coordsAtPos(from)
            setBlockPos({ top: (coords.top + coords.bottom) / 2, left: coords.left })
          } catch { setBlockPos(null) }
        } else {
          setBlockPos(null)
          setBlockOpen(false)
        }
      }
    },
    editorProps: {
      attributes: {
        class: 'min-h-[300px] p-6 focus:outline-none text-[var(--foreground)] prose dark:prose-invert max-w-none',
      },
    },
  })

  if (!editor) return null
  const ed = editor

  function openPanel(p: Panel) {
    if (p === 'link') {
      const { from, to } = ed.state.selection
      setSavedSel({ from, to })
      setInputVal(ed.getAttributes('link').href ?? '')
    } else if (p === 'color') {
      const { from, to } = ed.state.selection
      setSavedSel({ from, to })
      setInputVal(ed.getAttributes('textStyle').color ?? '')
    } else {
      setInputVal('')
    }
    setPanel(p)
  }

  function closePanel() { setPanel(null); setInputVal(''); setSavedSel(null) }

  function applyLink() {
    const href = inputVal.trim()
    if (!href) return
    const chain = ed.chain().focus()
    if (savedSel) chain.setTextSelection(savedSel)
    chain.setLink({ href }).run()
    closePanel()
  }

  function insertImageUrl() {
    const src = inputVal.trim()
    if (!src) return
    ed.chain().focus().setImage({ src }).run()
    closePanel()
    setBlockOpen(false)
  }

  function insertYoutube() {
    const src = inputVal.trim()
    if (!src) return
    ed.chain().focus().setYoutubeVideo({ src }).run()
    closePanel()
    setBlockOpen(false)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) ed.chain().focus().setImage({ src: data.url }).run()
    e.target.value = ''
    setBlockOpen(false)
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) ed.chain().focus().insertContent({ type: 'video', attrs: { src: data.url } }).run()
    e.target.value = ''
    setBlockOpen(false)
  }

  const fBtn = (active: boolean) =>
    `px-1.5 py-0.5 text-xs rounded transition-colors cursor-pointer select-none font-mono ${
      active ? 'bg-[var(--accent)] text-white' : 'text-[var(--foreground)] hover:bg-[var(--accent)]/20'
    }`

  const iBtn = 'px-2.5 py-1 text-xs rounded cursor-pointer transition-colors text-[var(--muted)] hover:bg-[var(--accent)] hover:text-white whitespace-nowrap'
  const sep = <span className="w-px self-stretch bg-[var(--border)] mx-0.5 shrink-0" />

  const currentFont = ed.getAttributes('textStyle').fontFamily as string | undefined
  const currentSize = ed.getAttributes('textStyle').fontSize as string | undefined
  const currentColor = ed.getAttributes('textStyle').color as string | undefined

  let bubbleInner: React.ReactNode

  if (panel === 'link') {
    bubbleInner = (
      <>
        <input autoFocus
          className="w-44 text-xs bg-[var(--background)] border border-[var(--border)] rounded px-2 py-0.5 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          placeholder="https://example.com"
          value={inputVal} onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') closePanel() }}
        />
        <button type="button" onClick={applyLink} className="px-2 py-0.5 text-xs bg-[var(--accent)] text-white rounded cursor-pointer">Apply</button>
        <button type="button" onClick={() => { ed.chain().focus().unsetLink().run(); closePanel() }} className="text-xs text-[var(--muted)] hover:text-red-500 cursor-pointer px-1">Remove</button>
        <button type="button" onClick={closePanel} className="text-[var(--muted)] text-xs cursor-pointer">✕</button>
      </>
    )
  } else if (panel === 'font') {
    bubbleInner = (
      <>
        {FONTS.map(f => (
          <button key={f.label} type="button" onMouseDown={e => e.preventDefault()}
            onClick={() => {
              f.value ? ed.chain().focus().setFontFamily(f.value).run() : ed.chain().focus().unsetFontFamily().run()
              closePanel()
            }}
            className={fBtn(!f.value ? !currentFont : currentFont === f.value)}
            style={f.value ? { fontFamily: f.value } : undefined}
          >{f.label}</button>
        ))}
        <button type="button" onClick={closePanel} className="text-[var(--muted)] text-xs cursor-pointer ml-1">✕</button>
      </>
    )
  } else if (panel === 'size') {
    bubbleInner = (
      <>
        {SIZES.map(s => (
          <button key={s.value} type="button" onMouseDown={e => e.preventDefault()}
            onClick={() => { (ed.chain().focus() as any).setFontSize(s.value).run(); closePanel() }}
            className={fBtn(currentSize === s.value)}
          >{s.label}</button>
        ))}
        <button type="button" onMouseDown={e => e.preventDefault()}
          onClick={() => { (ed.chain().focus() as any).unsetFontSize().run(); closePanel() }}
          className="text-[var(--muted)] text-xs cursor-pointer ml-1 px-1"
        >Reset</button>
        <button type="button" onClick={closePanel} className="text-[var(--muted)] text-xs cursor-pointer">✕</button>
      </>
    )
  } else if (panel === 'color') {
    const isValidHex = /^#[0-9a-fA-F]{3,8}$/.test(inputVal)
    const applyColor = (color: string) => {
      const chain = ed.chain().focus()
      if (savedSel) chain.setTextSelection(savedSel)
      ;(chain as any).setColor(color).run()
    }
    bubbleInner = (
      <>
        {COLORS.map(c => (
          <button key={c} type="button" onMouseDown={e => e.preventDefault()}
            onClick={() => { applyColor(c); closePanel() }}
            title={c}
            style={{ background: c }}
            className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-transform hover:scale-110 ${currentColor === c ? 'border-white shadow-md' : 'border-transparent'}`}
          />
        ))}
        {sep}
        <label className="relative w-6 h-6 cursor-pointer flex-shrink-0" title="Custom color picker">
          <span
            className="block w-6 h-6 rounded-full border-2 border-[var(--border)] overflow-hidden"
            style={{ background: inputVal || currentColor || '#000000' }}
          />
          <input type="color"
            value={inputVal || currentColor || '#000000'}
            onChange={e => { setInputVal(e.target.value); applyColor(e.target.value) }}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </label>
        <input
          className="w-20 text-xs bg-[var(--background)] border border-[var(--border)] rounded px-2 py-0.5 text-[var(--foreground)] outline-none focus:border-[var(--accent)] font-mono"
          placeholder="#hex"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && isValidHex) { applyColor(inputVal); closePanel() }
            if (e.key === 'Escape') closePanel()
          }}
        />
        <button type="button" onMouseDown={e => e.preventDefault()}
          onClick={() => { (ed.chain().focus() as any).unsetColor().run(); closePanel() }}
          className="text-[var(--muted)] text-xs cursor-pointer px-1 hover:text-red-500"
        >Reset</button>
        <button type="button" onClick={closePanel} className="text-[var(--muted)] text-xs cursor-pointer ml-0.5">✕</button>
      </>
    )
  } else {
    bubbleInner = (
      <>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => ed.chain().focus().toggleBold().run()} className={fBtn(ed.isActive('bold'))}>B</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => ed.chain().focus().toggleItalic().run()} className={fBtn(ed.isActive('italic'))}>I</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => ed.chain().focus().toggleStrike().run()} className={fBtn(ed.isActive('strike'))}>S̶</button>
        {sep}
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => ed.chain().focus().toggleHeading({ level: 2 }).run()} className={fBtn(ed.isActive('heading', { level: 2 }))}>H2</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => ed.chain().focus().toggleHeading({ level: 3 }).run()} className={fBtn(ed.isActive('heading', { level: 3 }))}>H3</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => ed.chain().focus().toggleHeading({ level: 4 }).run()} className={fBtn(ed.isActive('heading', { level: 4 }))}>H4</button>
        {sep}
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => openPanel('font')} className={fBtn(!!currentFont)} title="Font family">Aa</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => openPanel('size')} className={fBtn(!!currentSize)} title="Font size">Sz</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => openPanel('color')} title="Font color"
          className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer select-none ${!!currentColor ? 'bg-[var(--accent)]/20' : 'hover:bg-[var(--accent)]/20'}`}
        >
          <span className="text-xs font-mono font-bold" style={{ color: currentColor ?? 'var(--foreground)', textDecoration: 'underline', textDecorationColor: currentColor ?? 'var(--muted)', textDecorationThickness: '2px' }}>A</span>
        </button>
        {sep}
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => ed.chain().focus().toggleBulletList().run()} className={fBtn(ed.isActive('bulletList'))}>UL</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => ed.chain().focus().toggleOrderedList().run()} className={fBtn(ed.isActive('orderedList'))}>OL</button>
        {sep}
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => ed.chain().focus().toggleCode().run()} className={fBtn(ed.isActive('code'))}>{'`'}</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => ed.chain().focus().toggleBlockquote().run()} className={fBtn(ed.isActive('blockquote'))}>❝</button>
        {sep}
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => openPanel('link')} className={fBtn(ed.isActive('link'))}>Link</button>
      </>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <EditorContent editor={ed} />

      <input ref={imgFileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageUpload} />
      <input ref={vidFileRef} type="file" accept="video/mp4,video/webm,video/ogg" className="hidden" onChange={handleVideoUpload} />

      {mounted && bubblePos && createPortal(
        <div
          style={{ position: 'fixed', top: bubblePos.top, left: bubblePos.left, transform: 'translate(-50%, calc(-100% - 6px))', zIndex: 9999 }}
          className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] shadow-xl max-w-[90vw]"
        >
          {bubbleInner}
        </div>,
        document.body
      )}

      {mounted && blockPos && createPortal(
        <div
          style={{ position: 'fixed', top: blockPos.top, left: blockPos.left - 32, transform: 'translateY(-50%)', zIndex: 9999 }}
        >
          {!blockOpen ? (
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => setBlockOpen(true)}
              className="w-6 h-6 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] flex items-center justify-center text-base leading-none transition-colors cursor-pointer"
            >+</button>
          ) : (
            <div
              onMouseDown={e => e.preventDefault()}
              className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1.5 shadow-lg"
            >
              {panel === 'imgUrl' ? (
                <>
                  <input autoFocus
                    className="w-44 text-xs bg-[var(--background)] border border-[var(--border)] rounded px-2 py-0.5 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                    placeholder="https://example.com/image.jpg"
                    value={inputVal} onChange={e => setInputVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') insertImageUrl(); if (e.key === 'Escape') { closePanel(); setBlockOpen(false) } }}
                  />
                  <button type="button" onClick={insertImageUrl} className="px-2 py-0.5 text-xs bg-[var(--accent)] text-white rounded cursor-pointer">Insert</button>
                  <button type="button" onClick={() => { closePanel(); setBlockOpen(false) }} className="text-[var(--muted)] text-xs cursor-pointer">✕</button>
                </>
              ) : panel === 'ytUrl' ? (
                <>
                  <input autoFocus
                    className="w-44 text-xs bg-[var(--background)] border border-[var(--border)] rounded px-2 py-0.5 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                    placeholder="https://youtube.com/watch?v=..."
                    value={inputVal} onChange={e => setInputVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') insertYoutube(); if (e.key === 'Escape') { closePanel(); setBlockOpen(false) } }}
                  />
                  <button type="button" onClick={insertYoutube} className="px-2 py-0.5 text-xs bg-[var(--accent)] text-white rounded cursor-pointer">Embed</button>
                  <button type="button" onClick={() => { closePanel(); setBlockOpen(false) }} className="text-[var(--muted)] text-xs cursor-pointer">✕</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => openPanel('imgUrl')} className={iBtn}>Img URL</button>
                  <button type="button" onClick={() => imgFileRef.current?.click()} className={iBtn}>↑ Image</button>
                  <button type="button" onClick={() => vidFileRef.current?.click()} className={iBtn}>↑ Video</button>
                  <button type="button" onClick={() => openPanel('ytUrl')} className={iBtn}>YouTube</button>
                  <button type="button" onClick={() => { ed.chain().focus().setHorizontalRule().run(); setBlockOpen(false) }} className={iBtn}>— HR</button>
                  <button type="button" onClick={() => setBlockOpen(false)} className="text-[var(--muted)] text-xs cursor-pointer px-1">✕</button>
                </>
              )}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
