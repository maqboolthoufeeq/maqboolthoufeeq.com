/**
 * Tool definitions (schemas + descriptions) for the Link Hub MCP tools. Split out
 * from hub.ts so the executor stays focused on logic; the runtime behaviour lives
 * in hub.ts's `handle()`. See that file's header for the security model.
 */

import { HUB_LIMITS, HUB_ITEM_TYPES } from '@/lib/hub-content'
import type { ToolDef } from '../types'

/* ─── Detailed block-authoring guide (shared by create/update item schemas) ── */

const HUB_ITEM_GUIDE = `
A hub content block. \`type\` selects the payload; every block also takes an
optional \`description\`, \`categoryId\`, \`tagIds\`, \`published\`, \`order\`,
\`showDate\` and \`displayDate\`. Required fields by type:

  link      url                         — a button that opens a URL in a new tab
  text      content                     — short plain-text note (rendered escaped)
  markdown  content                     — Markdown source (rendered to safe HTML)
  richtext  content                     — HTML; sanitised on write (scripts stripped)
  image     images[] OR fileUrl OR url  — 1+ photos; multi = swipeable gallery
  video     fileUrl OR url              — uploaded MP4 (fileUrl) or any http(s) URL
                                          (YouTube/Vimeo embed inline; others link out)
  audio     fileUrl OR url              — uploaded blob or any http(s) audio URL
  pdf       fileUrl OR url              — uploaded blob or any http(s) PDF URL
  file      fileUrl                     — any downloadable file
  embed     url                         — allow-listed provider only (see below)

Field reference:
  url        http(s) link / external media / embed source (auto-prefixed https://)
  fileUrl    a hosted blob URL — to host an external image first, call
             upload_image_from_url, then pass the returned URL here / in images[]
  fileName, fileSize (bytes), fileType (MIME)  — optional metadata for downloads
  thumbnail  optional poster image (http(s)) for video/pdf
  images     gallery array: [{ url, fileName?, fileSize?, fileType? }], max ${HUB_LIMITS.images}
  content    capped at ${HUB_LIMITS.content} chars

EMBED providers (anything else is rejected): YouTube, Vimeo, Spotify, SoundCloud,
Loom, CodePen, Figma, Google Drive (/preview), Google Maps (/maps/embed). Pass the
normal share URL — the safe iframe src is rebuilt server-side.

Validation is identical to the admin editor: invalid/empty required fields, unsafe
URL schemes, or an un-embeddable provider return a descriptive error.`.trim()

const ITEM_PROPS: Record<string, unknown> = {
  type:        { type: 'string', enum: HUB_ITEM_TYPES, description: 'Block type — see the guide on this tool' },
  title:       { type: 'string', description: `Block title (required, ≤ ${HUB_LIMITS.title} chars)` },
  description: { type: 'string', description: 'Optional subtitle/caption' },
  url:         { type: 'string', description: 'http(s) link / external media / embed source' },
  fileUrl:     { type: 'string', description: 'Hosted blob URL (image/video/audio/pdf/file)' },
  fileName:    { type: 'string', description: 'Display filename for downloads' },
  fileSize:    { type: 'number', description: 'File size in bytes' },
  fileType:    { type: 'string', description: 'MIME type, e.g. image/png' },
  content:     { type: 'string', description: 'Body for text / markdown / richtext blocks' },
  thumbnail:   { type: 'string', description: 'Optional poster image URL (video/pdf)' },
  images: {
    type: 'array',
    description: 'Gallery photos for an image block: [{ url, fileName?, fileSize?, fileType? }]',
    items: { type: 'object' },
  },
  categoryId:  { type: 'string', description: 'HubCategory id (see list_hub_categories)' },
  tagIds:      { type: 'array', items: { type: 'string' }, description: 'Tag ids to attach (see list_tags)' },
  published:   { type: 'boolean', description: 'Visible publicly (default true)' },
  showDate:    { type: 'boolean', description: 'Show the date label publicly (default false)' },
  displayDate: { type: 'string', description: 'ISO date overriding createdAt for the public label + sort' },
  order:       { type: 'number', description: 'Sort position within the topic (lower = first)' },
}

const TOPIC_PROPS: Record<string, unknown> = {
  title:       { type: 'string', description: `Topic title (required, ≤ ${HUB_LIMITS.topicTitle} chars)` },
  description: { type: 'string', description: `Short summary (≤ ${HUB_LIMITS.description} chars)` },
  icon:        { type: 'string', description: `Emoji or lucide icon name (≤ ${HUB_LIMITS.icon} chars)` },
  coverImage:  { type: 'string', description: 'Cover/thumbnail image URL (http(s))' },
  parentId:    { type: 'string', description: 'Parent topic id to nest under (omit/null = top-level)' },
  categoryId:  { type: 'string', description: 'HubCategory id (see list_hub_categories)' },
  published:   { type: 'boolean', description: 'Visible publicly (default true). Hiding cascades to descendants.' },
  showDate:    { type: 'boolean', description: 'Show the date label publicly' },
  displayDate: { type: 'string', description: 'ISO date overriding createdAt for the public label + sort' },
  order:       { type: 'number', description: 'Sort position among siblings (lower = first)' },
  tagIds:      { type: 'array', items: { type: 'string' }, description: 'Tag ids to attach (see list_tags)' },
}

/* ─── Tool definitions ───────────────────────────────────────────────────── */

export const TOOLS: ToolDef[] = [
  /* Categories */
  {
    name: 'list_hub_categories',
    description: 'List all Link Hub categories (id, name, slug, color, order). Categories are the coloured facet chips that group topics and blocks.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'create_hub_category',
    description: 'Create a hub category. The slug is auto-generated from the name.',
    inputSchema: {
      type: 'object',
      properties: {
        name:  { type: 'string', description: `Category name (required, ≤ ${HUB_LIMITS.categoryName} chars)` },
        color: { type: 'string', description: 'Optional hex accent like #FF5500' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_hub_category',
    description: 'Update a hub category name, color and/or order. Slug is fixed at creation.',
    inputSchema: {
      type: 'object',
      properties: {
        id:    { type: 'string' },
        name:  { type: 'string' },
        color: { type: 'string', description: 'Hex like #FF5500, or null to clear' },
        order: { type: 'number' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_hub_category',
    description: 'Delete a hub category. Topics/blocks that referenced it keep existing — their category is simply cleared (set null).',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },
  {
    name: 'reorder_hub_categories',
    description: 'Set the display order of categories (the facet chips). Pass the category ids in the desired order; each category\'s order becomes its index in the array.',
    inputSchema: {
      type: 'object',
      properties: { ids: { type: 'array', items: { type: 'string' }, description: 'Category ids in the new display order' } },
      required: ['ids'],
    },
  },

  /* Topics */
  {
    name: 'list_hub_topics',
    description:
      'List Link Hub topics with their structure (id, title, slug, parentId, published, order, icon, description, category, tags, childCount, itemCount). ' +
      'Returns the whole tree flat by default — reconstruct nesting via parentId. Filter to one level with parentId ("root" for top-level, or a topic id for its direct children).',
    inputSchema: {
      type: 'object',
      properties: {
        parentId: { type: 'string', description: '"root" for top-level only, a topic id for its direct children, or omit for all topics' },
      },
    },
  },
  {
    name: 'get_hub_topic',
    description: 'Fetch one hub topic in full: metadata, its content blocks (in order), its direct subtopics, tags, category and parent.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },
  {
    name: 'create_hub_topic',
    description: 'Create a hub topic (or subtopic via parentId). The slug is auto-generated from the title.',
    inputSchema: { type: 'object', properties: TOPIC_PROPS, required: ['title'] },
  },
  {
    name: 'update_hub_topic',
    description:
      'Update any fields of a hub topic. Only provided fields change. Re-parenting is cycle-checked (a topic cannot be nested under itself or a descendant). ' +
      'The slug is preserved unless you pass regenerateSlug:true together with a new title.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, ...TOPIC_PROPS, regenerateSlug: { type: 'boolean', description: 'Rebuild the slug from the new title' } },
      required: ['id'],
    },
  },
  {
    name: 'delete_hub_topic',
    description: 'Permanently delete a hub topic. Cascades to all its subtopics and their content blocks. This cannot be undone.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },
  {
    name: 'reorder_hub_topics',
    description: 'Set the display order of a set of sibling topics. Pass the ids in the desired order; each topic\'s order becomes its index in the array.',
    inputSchema: {
      type: 'object',
      properties: { ids: { type: 'array', items: { type: 'string' }, description: 'Topic ids in the new display order' } },
      required: ['ids'],
    },
  },

  /* Items (content blocks) */
  {
    name: 'list_hub_items',
    description: 'List the content blocks of a hub topic, in display order, with their full payloads.',
    inputSchema: { type: 'object', properties: { topicId: { type: 'string' } }, required: ['topicId'] },
  },
  {
    name: 'get_hub_item',
    description: 'Fetch one hub content block by id, including its rendered HTML for markdown/richtext blocks.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },
  {
    name: 'create_hub_item',
    description: `Add a content block to a hub topic.\n\n${HUB_ITEM_GUIDE}`,
    inputSchema: {
      type: 'object',
      properties: { topicId: { type: 'string', description: 'Owning topic id (see list_hub_topics)' }, ...ITEM_PROPS },
      required: ['topicId', 'type', 'title'],
    },
  },
  {
    name: 'update_hub_item',
    description: `Update a content block. Only provided fields change; if you change type/title/content (or any payload field), pass enough fields for that type to re-validate.\n\n${HUB_ITEM_GUIDE}`,
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, ...ITEM_PROPS },
      required: ['id'],
    },
  },
  {
    name: 'delete_hub_item',
    description: 'Permanently delete a hub content block.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },
  {
    name: 'reorder_hub_items',
    description: 'Set the display order of blocks within a topic. Pass the block ids in the desired order; each block\'s order becomes its index.',
    inputSchema: {
      type: 'object',
      properties: { ids: { type: 'array', items: { type: 'string' }, description: 'Block ids in the new display order' } },
      required: ['ids'],
    },
  },
]
