'use client'

import { NodeViewWrapper } from '@tiptap/react'
import { useRef, useCallback } from 'react'

type Align = 'left' | 'center' | 'right'
type Dir = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'

interface MediaNodeViewProps {
  node: { attrs: Record<string, unknown> }
  selected: boolean
  updateAttributes: (attrs: Record<string, unknown>) => void
}

function buildStyle(align: Align, width: string): React.CSSProperties {
  if (align === 'left') return { width, float: 'left', marginRight: '1em', marginBottom: '0.5em', display: 'block' }
  if (align === 'right') return { width, float: 'right', marginLeft: '1em', marginBottom: '0.5em', display: 'block' }
  return { width, display: 'block', marginLeft: 'auto', marginRight: 'auto' }
}

const WIDTHS = ['25%', '50%', '75%', '100%']
const ALIGNS: { value: Align; label: string }[] = [
  { value: 'left', label: '⇤' },
  { value: 'center', label: '⇔' },
  { value: 'right', label: '⇥' },
]

const HANDLE_STYLE: Record<Dir, React.CSSProperties> = {
  n:  { top: 0,     left: '50%', transform: 'translate(-50%, -50%)', cursor: 'n-resize' },
  ne: { top: 0,     right: 0,    transform: 'translate(50%, -50%)',  cursor: 'ne-resize' },
  e:  { top: '50%', right: 0,    transform: 'translate(50%, -50%)',  cursor: 'e-resize' },
  se: { bottom: 0,  right: 0,    transform: 'translate(50%, 50%)',   cursor: 'se-resize' },
  s:  { bottom: 0,  left: '50%', transform: 'translate(-50%, 50%)',  cursor: 's-resize' },
  sw: { bottom: 0,  left: 0,     transform: 'translate(-50%, 50%)',  cursor: 'sw-resize' },
  w:  { top: '50%', left: 0,     transform: 'translate(-50%, -50%)', cursor: 'w-resize' },
  nw: { top: 0,     left: 0,     transform: 'translate(-50%, -50%)', cursor: 'nw-resize' },
}

const IMG_VIDEO_DIRS: Dir[] = ['nw', 'w', 'sw', 'se', 'e', 'ne']
const IFRAME_DIRS: Dir[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

function MediaToolbar({ align, onAlign, width, onWidth, height, onHeight }: {
  align: Align; onAlign: (a: Align) => void
  width: string; onWidth: (w: string) => void
  height?: string; onHeight?: (h: string) => void
}) {
  const btn = (active: boolean) =>
    `px-1.5 py-0.5 text-[11px] rounded cursor-pointer transition-colors ${
      active
        ? 'bg-[var(--accent)] text-white'
        : 'text-[var(--muted)] hover:bg-[var(--accent)]/20 hover:text-[var(--foreground)]'
    }`
  return (
    <div
      className="absolute -top-9 left-0 flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1 shadow-xl z-50 select-none whitespace-nowrap"
      onMouseDown={e => e.preventDefault()}
    >
      {ALIGNS.map(a => (
        <button key={a.value} type="button" className={btn(align === a.value)} title={a.value} onClick={() => onAlign(a.value)}>
          {a.label}
        </button>
      ))}
      <span className="w-px self-stretch bg-[var(--border)] mx-0.5" />
      {WIDTHS.map(w => (
        <button key={w} type="button" className={btn(width === w)} onClick={() => onWidth(w)}>
          {w}
        </button>
      ))}
      {height != null && onHeight && (
        <>
          <span className="w-px self-stretch bg-[var(--border)] mx-0.5" />
          <span className="text-[10px] text-[var(--muted)]">H:</span>
          <input
            className="w-14 text-[11px] bg-[var(--background)] border border-[var(--border)] rounded px-1 py-0 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
            value={height}
            onChange={e => onHeight(e.target.value)}
            onMouseDown={e => e.stopPropagation()}
            placeholder="400"
          />
        </>
      )}
    </div>
  )
}

function SelectionRing() {
  return <div className="absolute inset-0 border-2 border-[var(--accent)] rounded pointer-events-none z-40" />
}

function DragHandle() {
  return (
    <div
      data-drag-handle
      draggable={true}
      style={{
        position: 'absolute',
        top: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        cursor: 'grab',
        zIndex: 46,
        padding: '3px 8px',
        background: 'rgba(0,0,0,0.55)',
        borderRadius: 4,
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        lineHeight: 0,
      }}
      title="Drag to move"
    >
      <svg width="14" height="10" viewBox="0 0 14 10" fill="white">
        <circle cx="2" cy="2" r="1.2" />
        <circle cx="7" cy="2" r="1.2" />
        <circle cx="12" cy="2" r="1.2" />
        <circle cx="2" cy="8" r="1.2" />
        <circle cx="7" cy="8" r="1.2" />
        <circle cx="12" cy="8" r="1.2" />
      </svg>
    </div>
  )
}

function ResizeHandles({ dirs, onDirMouseDown }: {
  dirs: Dir[]
  onDirMouseDown: (e: React.MouseEvent, dir: Dir) => void
}) {
  return (
    <>
      {dirs.map(dir => (
        <div
          key={dir}
          style={{
            position: 'absolute', width: 10, height: 10, borderRadius: 2,
            background: 'var(--accent)', zIndex: 50, opacity: 0.85,
            ...HANDLE_STYLE[dir],
          }}
          onMouseDown={e => onDirMouseDown(e, dir)}
        />
      ))}
    </>
  )
}

function useResize(
  containerRef: React.RefObject<HTMLDivElement | null>,
  onUpdate: (updates: { width?: string; height?: string }) => void
) {
  return useCallback((e: React.MouseEvent, dir: Dir) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startW = containerRef.current?.offsetWidth ?? 300
    const startH = containerRef.current?.offsetHeight ?? 400
    const parentW = containerRef.current?.parentElement?.offsetWidth ?? 600

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      const updates: { width?: string; height?: string } = {}

      if (dir.includes('e')) {
        const newW = Math.max(80, Math.min(startW + dx, parentW))
        updates.width = `${Math.round((newW / parentW) * 100)}%`
      } else if (dir.includes('w')) {
        const newW = Math.max(80, Math.min(startW - dx, parentW))
        updates.width = `${Math.round((newW / parentW) * 100)}%`
      }

      if (dir.includes('s')) {
        updates.height = String(Math.max(80, Math.round(startH + dy)))
      } else if (dir.includes('n')) {
        updates.height = String(Math.max(80, Math.round(startH - dy)))
      }

      if (Object.keys(updates).length > 0) onUpdate(updates)
    }

    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [containerRef, onUpdate])
}

export function ImageNodeView({ node, selected, updateAttributes }: MediaNodeViewProps) {
  const ref = useRef<HTMLDivElement>(null)
  const align = ((node.attrs.align as string) ?? 'center') as Align
  const width = (node.attrs.width as string) ?? '100%'
  const startResize = useResize(ref, u => updateAttributes(u))
  return (
    <NodeViewWrapper style={{ display: 'flow-root' }}>
      <div ref={ref} style={{ position: 'relative', ...buildStyle(align, width) }}>
        {selected && <MediaToolbar align={align} onAlign={a => updateAttributes({ align: a })} width={width} onWidth={w => updateAttributes({ width: w })} />}
        <img src={node.attrs.src as string} alt={(node.attrs.alt as string) ?? ''} draggable={false} style={{ width: '100%', borderRadius: 6, display: 'block' }} />
        {selected && <><DragHandle /><ResizeHandles dirs={IMG_VIDEO_DIRS} onDirMouseDown={startResize} /><SelectionRing /></>}
      </div>
    </NodeViewWrapper>
  )
}

export function VideoNodeView({ node, selected, updateAttributes }: MediaNodeViewProps) {
  const ref = useRef<HTMLDivElement>(null)
  const align = ((node.attrs.align as string) ?? 'center') as Align
  const width = (node.attrs.width as string) ?? '100%'
  const startResize = useResize(ref, u => updateAttributes(u))
  return (
    <NodeViewWrapper style={{ display: 'flow-root' }}>
      <div ref={ref} style={{ position: 'relative', ...buildStyle(align, width) }}>
        {selected && <MediaToolbar align={align} onAlign={a => updateAttributes({ align: a })} width={width} onWidth={w => updateAttributes({ width: w })} />}
        <video controls draggable={false} style={{ width: '100%', borderRadius: 6, display: 'block' }}>
          <source src={node.attrs.src as string} />
        </video>
        {selected && <><DragHandle /><ResizeHandles dirs={IMG_VIDEO_DIRS} onDirMouseDown={startResize} /><SelectionRing /></>}
      </div>
    </NodeViewWrapper>
  )
}

export function IframeNodeView({ node, selected, updateAttributes }: MediaNodeViewProps) {
  const ref = useRef<HTMLDivElement>(null)
  const align = ((node.attrs.align as string) ?? 'center') as Align
  const width = (node.attrs.width as string) ?? '100%'
  const height = (node.attrs.height as string) ?? '400'
  const startResize = useResize(ref, u => updateAttributes(u))
  const hDisplay = height.endsWith('px') ? height : `${height}px`
  return (
    <NodeViewWrapper style={{ display: 'flow-root' }}>
      <div ref={ref} style={{ position: 'relative', ...buildStyle(align, width) }}>
        {selected && (
          <MediaToolbar
            align={align} onAlign={a => updateAttributes({ align: a })}
            width={width} onWidth={w => updateAttributes({ width: w })}
            height={height} onHeight={h => updateAttributes({ height: h })}
          />
        )}
        <iframe
          src={node.attrs.src as string}
          height={hDisplay}
          allow={node.attrs.allow as string}
          allowFullScreen={node.attrs.allowfullscreen != null}
          frameBorder="0"
          style={{ width: '100%', border: 'none', borderRadius: 6, display: 'block', pointerEvents: 'none' }}
        />
        {selected && <><DragHandle /><ResizeHandles dirs={IFRAME_DIRS} onDirMouseDown={startResize} /><SelectionRing /></>}
      </div>
    </NodeViewWrapper>
  )
}
