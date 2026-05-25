'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react'
import { Node, mergeAttributes } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import { TextStyle, FontFamily, FontSize, Color } from '@tiptap/extension-text-style'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import { ImageNodeView, VideoNodeView, IframeNodeView } from './MediaNodeViews'

function mediaStyleStr(align: string, width: string): string {
  if (align === 'left') return `width:${width};float:left;margin-right:1em;margin-bottom:0.5em;display:block;`
  if (align === 'right') return `width:${width};float:right;margin-left:1em;margin-bottom:0.5em;display:block;`
  return `width:${width};display:block;margin-left:auto;margin-right:auto;`
}

const IframeNode = Node.create({
  name: 'iframe',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null, parseHTML: el => el.getAttribute('src') },
      width: {
        default: '100%',
        parseHTML: el => el.style.width || el.getAttribute('width') || '100%',
      },
      height: { default: '400', parseHTML: el => el.getAttribute('height') ?? '400' },
      align: {
        default: 'center',
        parseHTML: el => el.style.float === 'left' ? 'left' : el.style.float === 'right' ? 'right' : 'center',
      },
      allow: { default: null, parseHTML: el => el.getAttribute('allow') },
      allowfullscreen: { default: null, parseHTML: el => el.hasAttribute('allowfullscreen') ? '' : null },
      webkitallowfullscreen: { default: null, parseHTML: el => el.hasAttribute('webkitallowfullscreen') ? '' : null },
      mozallowfullscreen: { default: null, parseHTML: el => el.hasAttribute('mozallowfullscreen') ? '' : null },
      frameborder: { default: '0', parseHTML: el => el.getAttribute('frameborder') ?? '0' },
      id: { default: null, parseHTML: el => el.getAttribute('id') },
    }
  },
  parseHTML() { return [{ tag: 'iframe' }] },
  renderHTML({ node }) {
    const { src, width, height, align, allow, allowfullscreen, webkitallowfullscreen, mozallowfullscreen, frameborder, id } = node.attrs as Record<string, string | null>
    const style = mediaStyleStr(align ?? 'center', width ?? '100%')
    const hVal = height ? (String(height).endsWith('px') ? height : `${height}px`) : '400px'
    const attrs: Record<string, string | null> = { src, height: hVal, style, frameborder: frameborder ?? '0' }
    if (allow) attrs.allow = allow
    if (allowfullscreen != null) attrs.allowfullscreen = ''
    if (webkitallowfullscreen != null) attrs.webkitallowfullscreen = ''
    if (mozallowfullscreen != null) attrs.mozallowfullscreen = ''
    if (id) attrs.id = id
    return ['iframe', mergeAttributes(Object.fromEntries(Object.entries(attrs).filter(([, v]) => v !== null)))]
  },
  addNodeView() { return ReactNodeViewRenderer(IframeNodeView) },
})

const VideoNode = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null, parseHTML: el => el.getAttribute('src') },
      width: {
        default: '100%',
        parseHTML: el => el.style.width || '100%',
      },
      align: {
        default: 'center',
        parseHTML: el => el.style.float === 'left' ? 'left' : el.style.float === 'right' ? 'right' : 'center',
      },
    }
  },
  parseHTML() { return [{ tag: 'video[src]' }] },
  renderHTML({ node }) {
    const { src, width, align } = node.attrs as Record<string, string>
    const style = mediaStyleStr(align ?? 'center', width ?? '100%')
    return ['video', { src: src ?? '', controls: '', style }, ['source', { src: src ?? '' }]]
  },
  addNodeView() { return ReactNodeViewRenderer(VideoNodeView) },
})

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: el => el.style.width || '100%',
      },
      align: {
        default: 'center',
        parseHTML: el => el.style.float === 'left' ? 'left' : el.style.float === 'right' ? 'right' : 'center',
      },
    }
  },
  renderHTML({ node }) {
    const { src, alt, title, width, align } = node.attrs as Record<string, string>
    const style = mediaStyleStr(align ?? 'center', width ?? '100%')
    const attrs: Record<string, string> = { src: src ?? '', style }
    if (alt) attrs.alt = alt
    if (title) attrs.title = title
    return ['img', attrs]
  },
  addNodeView() { return ReactNodeViewRenderer(ImageNodeView) },
})

function getEmbedKind(url: string): { kind: 'image' | 'video' | 'youtube' | 'iframe'; src: string } {
  if (/\.(jpe?g|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url)) return { kind: 'image', src: url }
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) return { kind: 'video', src: url }
  if (/(?:youtube\.com\/watch\?|youtu\.be\/)/.test(url)) return { kind: 'youtube', src: url }
  const dm = url.match(/drive\.google\.com\/file\/d\/([^/?\s]+)/)
  if (dm) return { kind: 'iframe', src: `https://drive.google.com/file/d/${dm[1]}/preview` }
  return { kind: 'iframe', src: url }
}

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

type Panel = 'link' | 'imgUrl' | 'ytUrl' | 'embedUrl' | 'iframeCode' | 'font' | 'size' | 'color' | 'table' | null
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
  const [tableToolbarPos, setTableToolbarPos] = useState<Pos | null>(null)
  const [tableSize, setTableSize] = useState({ rows: 3, cols: 3 })
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
      IframeNode,
      Youtube.configure({ controls: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      FontFamily,
      FontSize,
      Color,
    ],
    content,
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    onSelectionUpdate: ({ editor: ed }) => {
      const { from, to, empty } = ed.state.selection
      const inTable = ed.isActive('table')

      if (inTable) {
        try {
          const { $from } = ed.state.selection
          let d = $from.depth
          while (d > 0 && $from.node(d).type.name !== 'table') d--
          const coords = ed.view.coordsAtPos(d > 0 ? $from.before(d) + 1 : from)
          setTableToolbarPos({ top: coords.top, left: coords.left })
        } catch { setTableToolbarPos(null) }
      } else {
        setTableToolbarPos(null)
      }

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

  function insertEmbed() {
    const url = inputVal.trim()
    if (!url) return
    const { kind, src } = getEmbedKind(url)
    if (kind === 'image') ed.chain().focus().setImage({ src }).run()
    else if (kind === 'video') ed.chain().focus().insertContent({ type: 'video', attrs: { src } }).run()
    else if (kind === 'youtube') ed.chain().focus().setYoutubeVideo({ src }).run()
    else ed.chain().focus().insertContent({ type: 'iframe', attrs: { src, width: '100%', height: '400' } }).run()
    closePanel()
    setBlockOpen(false)
  }

  function insertIframeCode() {
    const code = inputVal.trim()
    if (!code) return
    const doc = new DOMParser().parseFromString(code, 'text/html')
    const iframe = doc.querySelector('iframe')
    if (iframe) {
      ed.chain().focus().insertContent({
        type: 'iframe',
        attrs: {
          src: iframe.getAttribute('src'),
          width: iframe.getAttribute('width') ?? '100%',
          height: iframe.getAttribute('height') ?? '400',
          allow: iframe.getAttribute('allow'),
          allowfullscreen: iframe.hasAttribute('allowfullscreen') ? '' : null,
          webkitallowfullscreen: iframe.hasAttribute('webkitallowfullscreen') ? '' : null,
          mozallowfullscreen: iframe.hasAttribute('mozallowfullscreen') ? '' : null,
          frameborder: iframe.getAttribute('frameborder') ?? '0',
          style: iframe.getAttribute('style'),
          id: iframe.getAttribute('id'),
        },
      }).run()
    }
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
              if (f.value) { ed.chain().focus().setFontFamily(f.value).run() } else { ed.chain().focus().unsetFontFamily().run() }
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={() => { (ed.chain().focus() as any).setFontSize(s.value).run(); closePanel() }}
            className={fBtn(currentSize === s.value)}
          >{s.label}</button>
        ))}
        <button type="button" onMouseDown={e => e.preventDefault()}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer select-none ${currentColor ? 'bg-[var(--accent)]/20' : 'hover:bg-[var(--accent)]/20'}`}
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

  function moveTableRow(dir: 'up' | 'down') {
    const { state, dispatch } = ed.view
    const { $from } = state.selection
    let d = $from.depth
    while (d > 0 && $from.node(d).type.name !== 'tableRow') d--
    if (!d) return
    const tblD = d - 1
    const tblNode = $from.node(tblD)
    const tblPos = $from.before(tblD)
    const rowPos = $from.before(d)
    let rowIdx = -1, p = tblPos + 1
    for (let i = 0; i < tblNode.childCount; i++) {
      if (p === rowPos) { rowIdx = i; break }
      p += tblNode.child(i).nodeSize
    }
    if (rowIdx < 0) return
    const target = dir === 'up' ? rowIdx - 1 : rowIdx + 1
    if (target < 0 || target >= tblNode.childCount) return
    const firstIdx = Math.min(rowIdx, target)
    const secondIdx = Math.max(rowIdx, target)
    let firstPos = tblPos + 1
    for (let i = 0; i < firstIdx; i++) firstPos += tblNode.child(i).nodeSize
    const secondPos = firstPos + tblNode.child(firstIdx).nodeSize
    const firstRow = tblNode.child(firstIdx)
    const secondRow = tblNode.child(secondIdx)
    const tr = state.tr
    tr.replaceWith(secondPos, secondPos + secondRow.nodeSize, firstRow)
    tr.replaceWith(firstPos, firstPos + firstRow.nodeSize, secondRow)
    dispatch(tr)
  }

  function moveTableCol(dir: 'left' | 'right') {
    const { state, dispatch } = ed.view
    const { $from } = state.selection
    let d = $from.depth
    while (d > 0 && !['tableCell', 'tableHeader'].includes($from.node(d).type.name)) d--
    if (!d) return
    const rowD = d - 1
    const tblD = d - 2
    if (tblD < 0) return
    const tblNode = $from.node(tblD)
    const tblPos = $from.before(tblD)
    const rowNode = $from.node(rowD)
    const rowPos = $from.before(rowD)
    const cellPos = $from.before(d)
    let colIdx = -1, cp = rowPos + 1
    for (let i = 0; i < rowNode.childCount; i++) {
      if (cp === cellPos) { colIdx = i; break }
      cp += rowNode.child(i).nodeSize
    }
    if (colIdx < 0) return
    const target = dir === 'left' ? colIdx - 1 : colIdx + 1
    const numCols = tblNode.firstChild?.childCount ?? 0
    if (target < 0 || target >= numCols) return
    const fci = Math.min(colIdx, target)
    const sci = Math.max(colIdx, target)
    const rows: { pos: number; node: ReturnType<typeof tblNode.child> }[] = []
    let rp = tblPos + 1
    for (let i = 0; i < tblNode.childCount; i++) {
      rows.push({ pos: rp, node: tblNode.child(i) })
      rp += tblNode.child(i).nodeSize
    }
    const tr = state.tr
    for (let ri = rows.length - 1; ri >= 0; ri--) {
      const { pos: rPos, node: rNode } = rows[ri]
      let fcp = rPos + 1
      for (let ci = 0; ci < fci; ci++) fcp += rNode.child(ci).nodeSize
      const scp = fcp + rNode.child(fci).nodeSize
      const fc = rNode.child(fci)
      const sc = rNode.child(sci)
      tr.replaceWith(scp, scp + sc.nodeSize, fc)
      tr.replaceWith(fcp, fcp + fc.nodeSize, sc)
    }
    dispatch(tr)
  }

  const tBtn = (label: string, cmd: () => boolean, disabled?: boolean) => (
    <button
      key={label}
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={() => cmd()}
      disabled={disabled}
      className="px-2 py-0.5 text-[11px] rounded cursor-pointer transition-colors text-[var(--muted)] hover:bg-[var(--accent)] hover:text-white whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
    >{label}</button>
  )

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
              ) : panel === 'embedUrl' ? (
                <>
                  <input autoFocus
                    className="w-56 text-xs bg-[var(--background)] border border-[var(--border)] rounded px-2 py-0.5 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                    placeholder="Image, video, Drive, PDF, or any URL…"
                    value={inputVal} onChange={e => setInputVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') insertEmbed(); if (e.key === 'Escape') { closePanel(); setBlockOpen(false) } }}
                  />
                  <button type="button" onClick={insertEmbed} className="px-2 py-0.5 text-xs bg-[var(--accent)] text-white rounded cursor-pointer">Embed</button>
                  <button type="button" onClick={() => { closePanel(); setBlockOpen(false) }} className="text-[var(--muted)] text-xs cursor-pointer">✕</button>
                </>
              ) : panel === 'iframeCode' ? (
                <>
                  <input autoFocus
                    className="w-72 text-xs bg-[var(--background)] border border-[var(--border)] rounded px-2 py-0.5 text-[var(--foreground)] outline-none focus:border-[var(--accent)] font-mono"
                    placeholder={'<iframe src="..." ...></iframe>'}
                    value={inputVal} onChange={e => setInputVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') insertIframeCode(); if (e.key === 'Escape') { closePanel(); setBlockOpen(false) } }}
                  />
                  <button type="button" onClick={insertIframeCode} className="px-2 py-0.5 text-xs bg-[var(--accent)] text-white rounded cursor-pointer">Insert</button>
                  <button type="button" onClick={() => { closePanel(); setBlockOpen(false) }} className="text-[var(--muted)] text-xs cursor-pointer">✕</button>
                </>
              ) : panel === 'table' ? (
                <>
                  <span className="text-[11px] text-[var(--muted)]">Rows:</span>
                  <input
                    type="number" min={1} max={20}
                    className="w-12 text-xs bg-[var(--background)] border border-[var(--border)] rounded px-1.5 py-0.5 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                    value={tableSize.rows}
                    onMouseDown={e => e.stopPropagation()}
                    onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) setTableSize(s => ({ ...s, rows: Math.max(1, Math.min(20, v)) })) }}
                  />
                  <span className="text-[11px] text-[var(--muted)]">Cols:</span>
                  <input
                    type="number" min={1} max={20}
                    className="w-12 text-xs bg-[var(--background)] border border-[var(--border)] rounded px-1.5 py-0.5 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                    value={tableSize.cols}
                    onMouseDown={e => e.stopPropagation()}
                    onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) setTableSize(s => ({ ...s, cols: Math.max(1, Math.min(20, v)) })) }}
                  />
                  <button type="button" onClick={() => { ed.chain().focus().insertTable({ rows: tableSize.rows, cols: tableSize.cols, withHeaderRow: true }).run(); closePanel(); setBlockOpen(false) }} className="px-2 py-0.5 text-xs bg-[var(--accent)] text-white rounded cursor-pointer">Insert</button>
                  <button type="button" onClick={() => { closePanel(); setBlockOpen(false) }} className="text-[var(--muted)] text-xs cursor-pointer">✕</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => openPanel('imgUrl')} className={iBtn}>Img URL</button>
                  <button type="button" onClick={() => imgFileRef.current?.click()} className={iBtn}>↑ Image</button>
                  <button type="button" onClick={() => vidFileRef.current?.click()} className={iBtn}>↑ Video</button>
                  <button type="button" onClick={() => openPanel('ytUrl')} className={iBtn}>YouTube</button>
                  <button type="button" onClick={() => openPanel('embedUrl')} className={iBtn}>Embed</button>
                  <button type="button" onClick={() => openPanel('iframeCode')} className={iBtn}>Iframe</button>
                  <button type="button" onClick={() => { ed.chain().focus().setHorizontalRule().run(); setBlockOpen(false) }} className={iBtn}>— HR</button>
                  <button type="button" onClick={() => openPanel('table')} className={iBtn}>Table</button>
                  <button type="button" onClick={() => setBlockOpen(false)} className="text-[var(--muted)] text-xs cursor-pointer px-1">✕</button>
                </>
              )}
            </div>
          )}
        </div>,
        document.body
      )}

      {mounted && tableToolbarPos && createPortal(
        <div
          style={{ position: 'fixed', top: tableToolbarPos.top, left: tableToolbarPos.left, transform: 'translateY(calc(-100% - 4px))', zIndex: 9998 }}
          className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] shadow-xl max-w-[90vw]"
          onMouseDown={e => e.preventDefault()}
        >
          {tBtn('+ Row ↓', () => ed.chain().focus().addRowAfter().run())}
          {tBtn('+ Row ↑', () => ed.chain().focus().addRowBefore().run())}
          {tBtn('- Row', () => ed.chain().focus().deleteRow().run())}
          {tBtn('↑ Row', () => { moveTableRow('up'); return true })}
          {tBtn('↓ Row', () => { moveTableRow('down'); return true })}
          <span className="w-px self-stretch bg-[var(--border)] mx-0.5" />
          {tBtn('+ Col →', () => ed.chain().focus().addColumnAfter().run())}
          {tBtn('+ Col ←', () => ed.chain().focus().addColumnBefore().run())}
          {tBtn('- Col', () => ed.chain().focus().deleteColumn().run())}
          {tBtn('← Col', () => { moveTableCol('left'); return true })}
          {tBtn('→ Col', () => { moveTableCol('right'); return true })}
          <span className="w-px self-stretch bg-[var(--border)] mx-0.5" />
          {tBtn('Merge', () => ed.chain().focus().mergeCells().run())}
          {tBtn('Split', () => ed.chain().focus().splitCell().run())}
          {tBtn('Header Row', () => ed.chain().focus().toggleHeaderRow().run())}
          <span className="w-px self-stretch bg-[var(--border)] mx-0.5" />
          {tBtn('✕ Table', () => ed.chain().focus().deleteTable().run())}
        </div>,
        document.body
      )}
    </div>
  )
}
