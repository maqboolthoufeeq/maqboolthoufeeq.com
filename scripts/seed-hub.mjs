// Dev seed for the Link Hub. Populates a rich, nested tree of topics/subtopics
// with every content-block type (Unsplash images for photos/covers) plus a mix
// of published/draft rows so the admin list, view toggle, multi-select and bulk
// publish/unpublish/delete actions all have plenty to exercise.
//
// Idempotent — clears existing hub rows first. Run:
//   node --env-file=.env.local scripts/seed-hub.mjs
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const cs = (process.env.DATABASE_URL ?? '').replace(/(\bsslmode=)(require|prefer|verify-ca)\b/gi, '$1verify-full')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: cs }) })

const slugify = (t) => t.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')

// Stable Unsplash CDN photos (rendered via plain <img> / background-image).
const PHOTOS = [
  '1506744038136-46273834b3fb', '1519681393784-d120267933ba', '1441974231531-c6227db76b6e',
  '1470071459604-3b5ec3a7fe05', '1518837695005-2083093ee35b', '1497436072909-60f360e1d4b1',
  '1500530855697-b586d89ba3ee', '1426604966848-d7adac402bff', '1469474968028-56623f02e42e',
  '1447752875215-b2761acb3c5d', '1454165804606-c3d57bc86b40', '1517694712202-14dd9538aa97',
  '1499951360447-b19be8fe80f5', '1558655146-9f40138edfeb', '1487058792275-0ad4aaf24ca7',
  '1488590528505-98d2b5aba04b', '1465101046530-73398c7f28ca', '1518770660439-4636190af475',
]
const img = (i, w = 1200) => `https://images.unsplash.com/photo-${PHOTOS[i % PHOTOS.length]}?w=${w}&q=80&auto=format&fit=crop`

// ─── Data ────────────────────────────────────────────────────────────────────
// Each topic: { title, category, published?, cover?, tags?, items?, children? }
// Each item:  { type, title, ...payload, published?, category? }

const CATEGORIES = [
  { name: 'Design', color: '#a855f7' },
  { name: 'Engineering', color: '#3b82f6' },
  { name: 'Photography', color: '#10b981' },
  { name: 'Learning', color: '#f59e0b' },
  { name: 'Tools', color: '#ef4444' },
]

const link = (title, url, extra = {}) => ({ type: 'link', title, url, ...extra })
const md = (title, content, extra = {}) => ({ type: 'markdown', title, content, ...extra })
const text = (title, content, extra = {}) => ({ type: 'text', title, content, ...extra })
const image = (title, i, extra = {}) => ({ type: 'image', title, url: img(i), ...extra })
const embed = (title, url, extra = {}) => ({ type: 'embed', title, url, ...extra })

const TOPICS = [
  {
    title: 'Design Inspiration', category: 'Design', cover: img(13), tags: ['inspiration', 'design'],
    items: [
      image('Hero gradient study', 13, { description: 'A moody gradient explored for a landing hero.' }),
      image('Editorial layout', 1, { category: 'Design' }),
      link('Dribbble — shots', 'https://dribbble.com', { description: 'Daily shots feed.' }),
      embed('Design systems talk', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
      md('Principles', '## Design principles\n\n- **Clarity** over cleverness\n- Consistent spacing scale\n- Accessible contrast (WCAG AA)\n\n> Good design is as little design as possible.'),
    ],
    children: [
      { title: 'UI Patterns', category: 'Design', tags: ['frontend'], items: [
        image('Card patterns', 2), link('UI Patterns', 'https://ui-patterns.com'), text('Note', 'Prefer progressive disclosure for dense forms.'),
      ] },
      { title: 'Color & Type', category: 'Design', items: [
        md('Palette', '### Palette\n\n`#0d0d0f` background, `#f59e0b` accent. Keep it to 1 accent.'),
        link('Type Scale', 'https://typescale.com'), image('Type specimen', 3),
      ] },
    ],
  },
  {
    title: 'Engineering Notes', category: 'Engineering', tags: ['nextjs', 'backend'],
    items: [
      md('Architecture', '# Architecture\n\nApp Router + RSC, Prisma + Postgres, Vercel Blob.\n\n```ts\nconst data = await getHubLanding()\n```'),
      link('Next.js Docs', 'https://nextjs.org/docs', { category: 'Engineering' }),
      embed('CodePen demo', 'https://codepen.io/team/codepen/pen/PNaGbb'),
      text('Reminder', 'Set NEXT_PUBLIC_SITE_URL and run prisma generate after schema changes.'),
      link('Prisma Docs', 'https://www.prisma.io/docs'),
    ],
    children: [
      { title: 'Backend', category: 'Engineering', tags: ['backend'], items: [
        link('PostgreSQL', 'https://www.postgresql.org/docs/'), md('Indexing', 'Add indexes on every FK and on columns used in `WHERE`/`ORDER BY`.'),
      ] },
      { title: 'Frontend', category: 'Engineering', tags: ['frontend'], items: [
        link('Tailwind CSS', 'https://tailwindcss.com'), embed('React talk', 'https://www.youtube.com/watch?v=Tn6-PIqc4UM'),
      ] },
    ],
  },
  {
    title: 'Photography', category: 'Photography', cover: img(4), tags: ['inspiration'],
    items: [
      image('Foggy ridge', 4), image('Alpine lake', 5), image('Golden valley', 7), text('Gear', 'Shot on a 35mm prime — light, sharp, versatile.'),
    ],
    children: [
      { title: 'Landscapes', category: 'Photography', items: [ image('Mountains at dawn', 8), image('Forest path', 9), image('Wide valley', 10) ] },
      { title: 'Street', category: 'Photography', items: [ image('City rhythm', 16, { published: false }), image('Neon night', 17) ] },
    ],
  },
  {
    title: 'Reading List', category: 'Learning', tags: ['docs'],
    items: [
      link('The Pragmatic Engineer', 'https://newsletter.pragmaticengineer.com'),
      link('Overreacted (Dan Abramov)', 'https://overreacted.io'),
      md('Queue', '### To read\n\n1. Designing Data-Intensive Applications\n2. Staff Engineer\n3. A Philosophy of Software Design'),
    ],
  },
  {
    title: 'Tools I Use', category: 'Tools', tags: ['tools'], cover: img(11),
    items: [
      link('VS Code', 'https://code.visualstudio.com'), link('Linear', 'https://linear.app'),
      link('Figma', 'https://figma.com', { category: 'Design' }), link('Vercel', 'https://vercel.com'),
      image('Desk setup', 11),
    ],
  },
  {
    title: 'Resources', category: 'Learning',
    items: [
      { type: 'file', title: 'Sample brief (PDF)', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'project-brief.pdf', fileType: 'application/pdf', fileSize: 13264 },
      { type: 'pdf', title: 'Style guide (PDF)', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileName: 'style-guide.pdf' },
      embed('Focus playlist', 'https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS'),
    ],
  },
  {
    title: 'Quick Links', category: 'Tools', tags: ['portfolio'],
    items: [
      link('GitHub', 'https://github.com'), link('LinkedIn', 'https://linkedin.com'),
      link('X / Twitter', 'https://x.com'), link('YouTube', 'https://youtube.com'),
      link('Instagram', 'https://instagram.com'), link('Email me', 'https://example.com/contact'),
    ],
  },
  {
    title: 'Music & Media', category: 'Learning',
    items: [
      embed('Coding playlist', 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ'),
      embed('SoundCloud set', 'https://soundcloud.com/forss/flickermood'),
      embed('Intro reel', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    ],
  },
  // Drafts / archive — start unpublished so publish/unpublish bulk actions have targets.
  {
    title: 'Drafts & WIP', category: 'Engineering', published: false, tags: ['vibe-coding'],
    items: [ md('Rough notes', 'Half-baked idea about a CRDT-backed editor…', { published: false }), link('Scratch repo', 'https://github.com') ],
    children: [ { title: 'Experiments', published: false, items: [ text('TODO', 'Try the new cache components API.') ] } ],
  },
  {
    title: 'Archive', category: 'Learning', published: false,
    items: [ image('Old shoot', 6), link('Legacy site', 'https://example.com'), md('Changelog', '- 2024: v1\n- 2025: v2\n- 2026: hub launch') ],
  },
]

// ─── Create ──────────────────────────────────────────────────────────────────
async function tag(name) {
  return prisma.tag.upsert({ where: { slug: slugify(name) }, update: {}, create: { name, slug: slugify(name) } })
}
async function uniqueSlug(base) {
  let slug = slugify(base) || 'topic', n = 1
  while (await prisma.hubTopic.findUnique({ where: { slug } })) { n++; slug = `${slugify(base) || 'topic'}-${n}` }
  return slug
}

async function main() {
  await prisma.hubItem.deleteMany({})
  await prisma.hubTopic.deleteMany({})
  await prisma.hubCategory.deleteMany({})

  const catByName = {}
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i]
    catByName[c.name] = await prisma.hubCategory.create({ data: { name: c.name, slug: slugify(c.name), color: c.color, order: i } })
  }

  let topicCount = 0, itemCount = 0

  async function createTopic(spec, parentId, order) {
    const tagConnect = []
    for (const name of spec.tags ?? []) { const t = await tag(name); tagConnect.push({ id: t.id }) }
    const topic = await prisma.hubTopic.create({
      data: {
        title: spec.title, slug: await uniqueSlug(spec.title),
        description: spec.description ?? null, icon: spec.icon ?? null, coverImage: spec.cover ?? null,
        order, published: spec.published !== false, parentId: parentId ?? null,
        categoryId: spec.category ? catByName[spec.category].id : null,
        showDate: true, displayDate: new Date(2026, 4, 1 + topicCount),
        tags: { connect: tagConnect },
      },
    })
    topicCount++
    const items = spec.items ?? []
    if (items.length) {
      await prisma.hubItem.createMany({
        data: items.map((it, idx) => ({
          topicId: topic.id, type: it.type, title: it.title,
          description: it.description ?? null, url: it.url ?? null,
          fileUrl: it.fileUrl ?? null, fileName: it.fileName ?? null, fileType: it.fileType ?? null, fileSize: it.fileSize ?? null,
          content: it.content ?? null, thumbnail: it.thumbnail ?? null,
          order: idx, published: it.published !== false,
          categoryId: it.category ? catByName[it.category].id : null,
        })),
      })
      itemCount += items.length
    }
    let childOrder = 0
    for (const child of spec.children ?? []) await createTopic(child, topic.id, childOrder++)
  }

  let order = 0
  for (const spec of TOPICS) await createTopic(spec, null, order++)

  // Enable the navbar link.
  const hub = { navEnabled: true, navLabel: 'Hub', title: 'Hub', subtitle: 'Curated topics, links, photos and resources — browse, search and download.' }
  await prisma.siteContent.upsert({ where: { key: 'hub' }, create: { key: 'hub', value: hub }, update: { value: hub } })

  console.log(`Seeded ${topicCount} topics and ${itemCount} items across ${CATEGORIES.length} categories. Nav enabled.`)
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
