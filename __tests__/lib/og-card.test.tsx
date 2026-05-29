import type { ReactElement } from 'react'
import { BrandedOgCard, CoverOgCard, OG_SIZE } from '@/lib/og-card'

/**
 * `next/og` renders these cards with Satori, which throws at runtime if any
 * element with more than one child node lacks an explicit display mode. That
 * failure can't be caught by `tsc` or a normal unit test, so we statically walk
 * the element tree and enforce the same rule here — guarding against the exact
 * regression where `{a} · {b}` silently becomes multiple child text nodes.
 */
type AnyEl = ReactElement<{ style?: Record<string, unknown>; children?: unknown }>

function toNodes(children: unknown): unknown[] {
  if (children == null || typeof children === 'boolean') return []
  if (Array.isArray(children)) {
    return children.flat(Infinity).filter((c) => c != null && typeof c !== 'boolean')
  }
  return [children]
}

function isElement(node: unknown): node is AnyEl {
  return typeof node === 'object' && node !== null && 'type' in (node as object) && 'props' in (node as object)
}

function walk(node: unknown, visit: (el: AnyEl, nodeCount: number) => void): void {
  if (!isElement(node)) return
  const nodes = toNodes(node.props?.children)
  visit(node, nodes.length)
  for (const child of nodes) walk(child, visit)
}

const VALID_DISPLAY = ['flex', 'contents', 'none']

describe('OG card Satori constraints', () => {
  const cards: Array<[string, AnyEl]> = [
    ['BrandedOgCard with subtitle', BrandedOgCard({ title: 'Hello World', subtitle: 'A subtitle' }) as AnyEl],
    ['BrandedOgCard without subtitle', BrandedOgCard({ title: 'Hello World' }) as AnyEl],
    ['CoverOgCard', CoverOgCard({ cover: 'data:image/png;base64,AAAA', title: 'A post title' }) as AnyEl],
  ]

  it.each(cards)('%s: every multi-child host element declares a display mode', (_name, card) => {
    walk(card, (el, nodeCount) => {
      if (typeof el.type === 'string' && nodeCount > 1) {
        const display = el.props?.style?.display
        expect({ tag: el.type, display, nodeCount }).toEqual(
          expect.objectContaining({ display: expect.stringMatching(/^(flex|contents|none)$/) }),
        )
        expect(VALID_DISPLAY).toContain(display)
      }
    })
  })

  it('renders at the 1200x630 size social crawlers expect', () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 })
  })

  it('CoverOgCard places the cover image as a raw <img> (Satori has no next/image)', () => {
    let foundImg = false
    walk(CoverOgCard({ cover: 'data:image/png;base64,AAAA', title: 'x' }) as AnyEl, (el) => {
      if (el.type === 'img') foundImg = true
    })
    expect(foundImg).toBe(true)
  })
})
