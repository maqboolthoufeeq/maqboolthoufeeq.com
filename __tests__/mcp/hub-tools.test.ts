// Prisma is mocked so these tests stay DB-free: every assertion exercises a path
// that validates and throws BEFORE any prisma query runs.
jest.mock('@/lib/prisma', () => ({ prisma: {} }))

import { TOOLS, handle } from '@/app/mcp/tools/hub'
import { ALL_TOOLS } from '@/app/mcp/registry'

const NAMES = TOOLS.map((t) => t.name)

describe('hub MCP tool surface', () => {
  it('exposes full CRUD + list/get + reorder across all three entities', () => {
    expect(new Set(NAMES)).toEqual(
      new Set([
        // categories
        'list_hub_categories', 'create_hub_category', 'update_hub_category', 'delete_hub_category', 'reorder_hub_categories',
        // topics
        'list_hub_topics', 'get_hub_topic', 'create_hub_topic', 'update_hub_topic', 'delete_hub_topic', 'reorder_hub_topics',
        // items / content blocks
        'list_hub_items', 'get_hub_item', 'create_hub_item', 'update_hub_item', 'delete_hub_item', 'reorder_hub_items',
      ]),
    )
  })

  it('every tool has a well-formed object input schema with required fields declared in properties', () => {
    for (const t of TOOLS) {
      expect(typeof t.description).toBe('string')
      expect(t.inputSchema.type).toBe('object')
      for (const req of t.inputSchema.required ?? []) {
        expect(Object.keys(t.inputSchema.properties)).toContain(req)
      }
    }
  })

  it('namespaces every hub tool with _hub_ and never collides with another module', () => {
    expect(NAMES.every((n) => n.includes('_hub_'))).toBe(true)
    const all = ALL_TOOLS.map((t) => t.name)
    expect(all.length).toBe(new Set(all).size) // globally unique across the registry
  })

  it('registers the hub tools in the shared registry', () => {
    const all = new Set(ALL_TOOLS.map((t) => t.name))
    for (const n of NAMES) expect(all.has(n)).toBe(true)
  })
})

describe('hub tool validation (pre-DB short-circuits)', () => {
  it('rejects an empty / over-long category name and a bad hex color', async () => {
    await expect(handle('create_hub_category', { name: '   ' })).rejects.toThrow(/required/i)
    await expect(handle('create_hub_category', { name: 'x'.repeat(200) })).rejects.toThrow(/under/i)
    await expect(handle('create_hub_category', { name: 'Tools', color: 'red' })).rejects.toThrow(/hex/i)
  })

  it('rejects an empty / over-long topic title', async () => {
    await expect(handle('create_hub_topic', { title: '' })).rejects.toThrow(/required/i)
    await expect(handle('create_hub_topic', { title: 'x'.repeat(500) })).rejects.toThrow(/under/i)
  })

  it('rejects an empty reorder list before touching the database', async () => {
    await expect(handle('reorder_hub_topics', { ids: [] })).rejects.toThrow(/non-empty/i)
    await expect(handle('reorder_hub_items', { ids: [] })).rejects.toThrow(/non-empty/i)
    await expect(handle('reorder_hub_categories', { ids: [] })).rejects.toThrow(/non-empty/i)
  })

  it('throws on an unknown tool name', async () => {
    await expect(handle('frobnicate_hub', {})).rejects.toThrow(/Unknown tool/i)
  })
})
