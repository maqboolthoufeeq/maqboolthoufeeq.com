import type { ResolvedSeo, SocialLink } from '@/lib/site-content'

/**
 * schema.org JSON-LD builders. Every value is resolved at request time from the
 * admin-editable site identity (`getSeo`, Hero, About, Contact), so the
 * structured data describes the real owner with zero hardcoded personal data —
 * a fresh clone automatically describes whoever deploys it.
 *
 * The graph is cross-linked by stable `@id`s so Google and AI engines treat the
 * Person / WebSite / Organization as single entities across every page:
 *   - `${origin}/#person`        — the author (E-E-A-T / knowledge-graph entity)
 *   - `${origin}/#website`       — the site (sitelinks search box)
 *   - `${origin}/#organization`  — the publishing brand (article publisher)
 *   - `${origin}/#profilepage`   — the home page as a ProfilePage
 *   - `${origin}/blog#blog`      — the blog
 */

type Node = Record<string, unknown>

const SCHEMA = 'https://schema.org'

export function ids(origin: string) {
  return {
    person: `${origin}/#person`,
    website: `${origin}/#website`,
    organization: `${origin}/#organization`,
    profilePage: `${origin}/#profilepage`,
    blog: `${origin}/blog#blog`,
  }
}

/**
 * Normalize the Hero social links into absolute https `sameAs` URLs: adds a
 * scheme when missing (links are sometimes stored as "linkedin.com/in/x"),
 * drops mailto:/tel:, trims trailing slashes and dedupes. Email is carried
 * separately in the Person `email` field, not in `sameAs`.
 */
export function normalizeSameAs(links: SocialLink[] | undefined): string[] {
  const out: string[] = []
  for (const link of links ?? []) {
    const href = (link?.href ?? '').trim()
    if (!href || /^(mailto:|tel:)/i.test(href)) continue
    const abs = /^https?:\/\//i.test(href) ? href : `https://${href.replace(/^\/+/, '')}`
    out.push(abs.replace(/\/+$/, ''))
  }
  return Array.from(new Set(out))
}

export interface Identity {
  origin: string
  seo: ResolvedSeo
  /** Absolute URL of the owner's photo (Hero image). */
  imageUrl?: string
  sameAs?: string[]
  /** Topics the owner is an authority on (About skills) — entity/E-E-A-T signal. */
  knowsAbout?: string[]
  email?: string
}

export function organizationNode({ origin, seo, imageUrl, sameAs }: Identity): Node {
  const id = ids(origin)
  return {
    '@type': 'Organization',
    '@id': id.organization,
    name: seo.siteName,
    url: origin,
    ...(imageUrl ? { logo: { '@type': 'ImageObject', url: imageUrl }, image: imageUrl } : {}),
    ...(sameAs?.length ? { sameAs } : {}),
  }
}

export function personNode({ origin, seo, imageUrl, sameAs, knowsAbout, email }: Identity): Node {
  const id = ids(origin)
  return {
    '@type': 'Person',
    '@id': id.person,
    name: seo.author || seo.siteName,
    url: origin,
    ...(imageUrl ? { image: { '@type': 'ImageObject', url: imageUrl } } : {}),
    ...(seo.role ? { jobTitle: seo.role } : {}),
    ...(seo.tagline ? { description: seo.tagline } : {}),
    ...(email ? { email } : {}),
    ...(knowsAbout?.length ? { knowsAbout } : {}),
    ...(sameAs?.length ? { sameAs } : {}),
    worksFor: { '@id': id.organization },
    mainEntityOfPage: { '@id': id.website },
  }
}

export function websiteNode({ origin, seo }: { origin: string; seo: ResolvedSeo }): Node {
  const id = ids(origin)
  return {
    '@type': 'WebSite',
    '@id': id.website,
    url: origin,
    name: seo.siteName,
    ...(seo.tagline ? { description: seo.tagline } : {}),
    inLanguage: 'en-US',
    publisher: { '@id': id.organization },
    author: { '@id': id.person },
    // Sitelinks search box → the blog search (which already supports ?q=).
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${origin}/blog?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }
}

/** The sitewide identity graph (WebSite + Organization + Person), injected once in the root layout. */
export function identityGraph(identity: Identity): Node {
  return {
    '@context': SCHEMA,
    '@graph': [websiteNode(identity), organizationNode(identity), personNode(identity)],
  }
}

/** ProfilePage for the home page of a personal site — mainEntity is the Person. */
export function profilePageNode({
  origin,
  seo,
  imageUrl,
  dateModified,
}: {
  origin: string
  seo: ResolvedSeo
  imageUrl?: string
  dateModified?: string
}): Node {
  const id = ids(origin)
  return {
    '@context': SCHEMA,
    '@type': 'ProfilePage',
    '@id': id.profilePage,
    url: origin,
    name: `${seo.siteName} — ${seo.role}`,
    ...(seo.tagline ? { description: seo.tagline } : {}),
    inLanguage: 'en-US',
    isPartOf: { '@id': id.website },
    ...(imageUrl ? { primaryImageOfPage: { '@type': 'ImageObject', url: imageUrl } } : {}),
    ...(dateModified ? { dateModified } : {}),
    mainEntity: { '@id': id.person },
  }
}

export interface ArticleInput {
  origin: string
  slug: string
  title: string
  description: string
  /** Absolute cover/share image URL; falls back to the dynamic /og card. */
  image?: string
  datePublished?: string
  dateModified?: string
  tags?: string[]
  wordCount?: number
}

export function articleNode(a: ArticleInput): Node {
  const id = ids(a.origin)
  const canonical = `${a.origin}/blog/${a.slug}`
  const image = a.image || `${a.origin}/blog/${a.slug}/og`
  return {
    '@type': 'BlogPosting',
    '@id': `${canonical}#article`,
    headline: a.title.slice(0, 110),
    name: a.title,
    description: a.description,
    // A plain URL (not an ImageObject with fixed dims) — cover images are often
    // external with unknown dimensions; the /og fallback is the only 1200x630.
    image,
    url: canonical,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    isPartOf: { '@id': id.blog },
    inLanguage: 'en-US',
    author: { '@id': id.person },
    publisher: { '@id': id.organization },
    ...(a.datePublished ? { datePublished: a.datePublished } : {}),
    ...(a.dateModified ? { dateModified: a.dateModified } : {}),
    ...(a.tags?.length ? { keywords: a.tags.join(', '), articleSection: a.tags[0] } : {}),
    ...(a.wordCount ? { wordCount: a.wordCount } : {}),
  }
}

/** Breadcrumb trail. `path` is the pathname; "/" maps to the bare origin. */
export function breadcrumbNode(origin: string, items: { name: string; path: string }[]): Node {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${origin}${it.path === '/' ? '' : it.path}`,
    })),
  }
}

export interface BlogListItem {
  slug: string
  title: string
  datePublished?: string
}

export function blogListingNode({
  origin,
  seo,
  description,
  posts,
}: {
  origin: string
  seo: ResolvedSeo
  description: string
  posts: BlogListItem[]
}): Node {
  const id = ids(origin)
  return {
    '@type': 'Blog',
    '@id': id.blog,
    url: `${origin}/blog`,
    name: `${seo.siteName} — Blog`,
    description,
    inLanguage: 'en-US',
    isPartOf: { '@id': id.website },
    publisher: { '@id': id.organization },
    author: { '@id': id.person },
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      '@id': `${origin}/blog/${p.slug}#article`,
      headline: p.title,
      url: `${origin}/blog/${p.slug}`,
      ...(p.datePublished ? { datePublished: p.datePublished } : {}),
      author: { '@id': id.person },
    })),
  }
}

export interface CollectionItem {
  name: string
  url?: string
}

export function collectionPageNode({
  origin,
  name,
  path,
  description,
  items,
}: {
  origin: string
  name: string
  path: string
  description?: string
  items: CollectionItem[]
}): Node {
  const id = ids(origin)
  return {
    '@type': 'CollectionPage',
    '@id': `${origin}${path}#collection`,
    url: `${origin}${path}`,
    name,
    ...(description ? { description } : {}),
    inLanguage: 'en-US',
    isPartOf: { '@id': id.website },
    ...(items.length
      ? {
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: items.length,
            itemListElement: items.map((it, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: it.name,
              ...(it.url ? { url: it.url } : {}),
            })),
          },
        }
      : {}),
  }
}

/** Wrap one or more page-specific nodes in a single @graph document. */
export function pageGraph(nodes: Node[]): Node {
  return { '@context': SCHEMA, '@graph': nodes }
}
