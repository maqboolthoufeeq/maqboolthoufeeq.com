import { cache } from 'react'
import { prisma } from './prisma'
import { getSiteUrl } from './utils'

export type ImageShape = 'circle' | 'rounded' | 'square'
export type ImageSize = 'sm' | 'md' | 'lg'

export interface SocialLink {
  platform: string
  href: string
}

export interface HeroContent {
  greeting: string
  name: string
  lastName: string
  title: string
  description: string
  cta1Label: string
  cta1Href: string
  cta2Label: string
  cta2Href: string
  imageUrl: string
  imageVisible: boolean
  imageShape: ImageShape
  imageSize: ImageSize
  socialLinks: SocialLink[]
}

export interface AboutContent {
  paragraphs: string[]
  skills: string[]
}

export interface NavLink {
  href: string
  label: string
}

export interface NavbarContent {
  brandName: string
  brandTag: string
  links: NavLink[]
}

export interface ContactLink {
  href: string
  label: string
}

export interface ContactExtra {
  label: string
  value: string
}

export interface ContactContent {
  description: string
  email: string
  phone: string
  address: string
  extra: ContactExtra[]
  links: ContactLink[]
}

export interface FooterContent {
  copyrightName: string
  /** Short blurb shown under the brand name in the expanded footer. */
  tagline: string
}

/**
 * Editable Privacy Policy and Terms & Conditions pages, linked from the footer.
 * The body fields hold sanitised rich-text HTML (same pipeline as blog posts).
 */
export interface LegalContent {
  privacyTitle: string
  privacyBody: string
  termsTitle: string
  termsBody: string
  /** Free-text "last updated" label shown at the top of each legal page. */
  updated: string
}

export interface SectionVisibility {
  hero: boolean
  about: boolean
  projects: boolean
  blogPreview: boolean
  socialMedia: boolean
  /** Show the Reels row inside the social section (independent of videos). */
  socialReels: boolean
  /** Show the Videos row inside the social section (independent of reels). */
  socialVideos: boolean
  contact: boolean
  blogArchive: boolean
  /** Show a Link Hub preview section on the landing page (falls back to hidden
   *  automatically when there's no hub content yet). */
  hub: boolean
}

export interface AnalyticsContent {
  /** Show the unique-visitor count in the public landing-page footer. */
  showVisitors: boolean
  /** Show the total page-view count in the public landing-page footer. */
  showPageViews: boolean
  /** Show per-post view/zap stats publicly at the top of each blog post. */
  showBlogStats: boolean
}

/**
 * Config for the Link Hub — a Linktree-style tree of topics/subtopics and rich
 * content. `navEnabled` is the single admin switch that shows/hides the `/hub`
 * link in the navbar; the page itself is always reachable so existing links keep
 * working even when it's off the nav.
 */
export interface HubContent {
  /** Show the hub link in the navbar (desktop + mobile). */
  navEnabled: boolean
  /** Label for the navbar link, e.g. "Hub", "Links", "Resources". */
  navLabel: string
  /** Heading shown at the top of the public hub page. */
  title: string
  /** One-line subtitle under the hub heading. */
  subtitle: string
}

/**
 * Site identity used for SEO, page titles and social share cards. Every field
 * is optional in practice: leave a field blank and it falls back to a sensible
 * value derived from the Navbar/Hero content (see {@link getSeo}), so a fresh
 * clone works out of the box and existing sites keep their identity.
 */
export interface SeoContent {
  /** Brand/site name, e.g. "Jane Doe". Blank → derived from the navbar brand. */
  siteName: string
  /** Content author for metadata + share cards. Blank → same as siteName. */
  author: string
  /** One-line tagline used as the default share description. Blank → hero description. */
  tagline: string
  /** Professional role shown on share cards, e.g. "Software Engineer". Blank → hero title. */
  role: string
}

const DEFAULTS = {
  navbar: {
    brandName: 'Your Name',
    brandTag: '',
    links: [
      { href: '/#about', label: 'About' },
      { href: '/#projects', label: 'Projects' },
      { href: '/blog', label: 'Blog' },
      { href: '/#contact', label: 'Contact' },
    ],
  } satisfies NavbarContent,

  hero: {
    greeting: "Hello, I'm",
    name: 'Your Name',
    lastName: '',
    title: 'Your Title',
    description:
      'A short sentence about what you do and what you build. Edit this in Admin → Landing page → Hero.',
    cta1Label: 'See my work',
    cta1Href: '/#projects',
    cta2Label: 'Get in touch',
    cta2Href: '/#contact',
    imageUrl: '/headshot.jpg',
    imageVisible: true as boolean,
    imageShape: 'circle' as ImageShape,
    imageSize: 'md' as ImageSize,
    socialLinks: [] as SocialLink[],
  } satisfies HeroContent,

  about: {
    paragraphs: [
      'Write a short bio here. Tell visitors who you are, what you do, and what you care about. Edit this in Admin → Landing page → About.',
      "Add a second paragraph for more detail — your background, interests, or what you're working on right now.",
    ],
    skills: ['Add', 'your', 'skills', 'here'],
  } satisfies AboutContent,

  contact: {
    description: "I'm always open to interesting projects and opportunities. Whether you have a question or just want to say hi — feel free to reach out.",
    email: '',
    phone: '',
    address: '',
    extra: [] as ContactExtra[],
    links: [
      { href: 'mailto:you@example.com', label: 'Email' },
      { href: 'https://github.com/your-username', label: 'GitHub' },
      { href: 'https://linkedin.com/in/your-username', label: 'LinkedIn' },
    ],
  } satisfies ContactContent,

  footer: {
    copyrightName: 'Your Name',
    tagline: 'Building thoughtful software and sharing what I learn along the way.',
  } satisfies FooterContent,

  legal: {
    privacyTitle: 'Privacy Policy',
    privacyBody: [
      '<p>Your privacy matters. This page explains what information this website collects, how it is used, and the choices you have. Edit this text in Admin → Landing page → Legal pages.</p>',
      '<h2>Information we collect</h2>',
      '<p>When you visit this site we may collect anonymous analytics such as page views and aggregate visitor counts. If you submit the contact form, we receive the name, email address, message and any attachment you provide so we can reply to you.</p>',
      '<h2>How we use information</h2>',
      '<p>We use the information solely to operate and improve the site and to respond to enquiries. We do not sell your personal information to third parties.</p>',
      '<h2>Cookies</h2>',
      '<p>We use a minimal cookie to remember theme preferences and to de-duplicate visitor counts. You can clear these at any time through your browser settings.</p>',
      '<h2>Contact</h2>',
      '<p>If you have any questions about this policy or your data, please reach out through the contact section of the site.</p>',
    ].join('\n'),
    termsTitle: 'Terms & Conditions',
    termsBody: [
      '<p>By accessing and using this website you agree to the following terms. Edit this text in Admin → Landing page → Legal pages.</p>',
      '<h2>Use of the site</h2>',
      '<p>You may browse and share the content here for personal, non-commercial purposes. You agree not to misuse the site, attempt to disrupt it, or access it in any unlawful way.</p>',
      '<h2>Intellectual property</h2>',
      '<p>Unless stated otherwise, all content — text, images, projects and posts — is owned by the site author and may not be reproduced without permission.</p>',
      '<h2>Disclaimer</h2>',
      '<p>The content is provided “as is” without warranties of any kind. The site author is not liable for any loss arising from its use.</p>',
      '<h2>Changes</h2>',
      '<p>These terms may be updated from time to time. Continued use of the site after changes constitutes acceptance of the revised terms.</p>',
    ].join('\n'),
    updated: '',
  } satisfies LegalContent,

  seo: {
    siteName: '',
    author: '',
    tagline: '',
    role: '',
  } satisfies SeoContent,

  sections: {
    hero: true as boolean,
    about: true as boolean,
    projects: true as boolean,
    blogPreview: true as boolean,
    socialMedia: true as boolean,
    socialReels: true as boolean,
    socialVideos: true as boolean,
    contact: true as boolean,
    blogArchive: true as boolean,
    hub: true as boolean,
  } satisfies SectionVisibility,

  analytics: {
    showVisitors: false as boolean,
    showPageViews: false as boolean,
    showBlogStats: false as boolean,
  } satisfies AnalyticsContent,

  hub: {
    navEnabled: false as boolean,
    navLabel: 'Hub',
    title: 'Hub',
    subtitle: 'Curated topics, links and resources — browse, search and download.',
  } satisfies HubContent,
}

type ContentKey = keyof typeof DEFAULTS
type ContentValue<K extends ContentKey> = (typeof DEFAULTS)[K]

/**
 * One `findMany` per request for the whole (small) SiteContent table, deduped
 * with React `cache()`. Pages call `getSiteContent(<key>)` from many sections
 * independently; each call used to be its own `findUnique`, so a single
 * homepage render burned 5+ queries on this table alone. Outside RSC rendering
 * (route handlers) `cache()` is a passthrough — one query per call, no worse
 * than before.
 */
const loadSiteContent = cache(async (): Promise<Map<string, unknown>> => {
  const rows = await prisma.siteContent.findMany({ select: { key: true, value: true } })
  return new Map(rows.map((r) => [r.key, r.value]))
})

/** Raw stored value for any key (no defaults merge) from the batched read. */
export async function getRawSiteContent(key: string): Promise<unknown> {
  return (await loadSiteContent()).get(key)
}

export async function getSiteContent<K extends ContentKey>(key: K): Promise<ContentValue<K>> {
  const value = await getRawSiteContent(key)
  if (value === undefined) {
    // Lazily seed defaults, tolerating a concurrent request that seeded the same
    // key first (unique-constraint race → P2002). Without this, the first burst
    // of hits on a fresh database — now including the favicon/manifest/sitemap
    // routes — could 500 on the losing request.
    try {
      await prisma.siteContent.create({ data: { key, value: DEFAULTS[key] as object } })
    } catch {
      /* another request created this key concurrently — fine, use the defaults */
    }
    return DEFAULTS[key]
  }
  return { ...DEFAULTS[key], ...(value as object) } as ContentValue<K>
}

export async function setSiteContent<K extends ContentKey>(key: K, value: ContentValue<K>) {
  await prisma.siteContent.upsert({
    where: { key },
    create: { key, value: value as object },
    update: { value: value as object },
  })
}

/** Fully-resolved site identity, ready to drop into metadata + share cards. */
export interface ResolvedSeo {
  siteName: string
  author: string
  tagline: string
  role: string
  /** Canonical origin, e.g. https://example.com (no trailing slash). */
  siteUrl: string
  /** Bare host, e.g. example.com — used on the share-card footer. */
  domain: string
}

const GENERIC_SEO = {
  siteName: 'My Portfolio',
  tagline: 'Personal portfolio and blog.',
  role: 'Portfolio',
} as const

/**
 * Resolve the effective site identity for SEO, titles and Open Graph cards.
 *
 * Each explicit `seo` field wins; when one is blank it falls back to the
 * content the user is already editing (Navbar brand / Hero name, title and
 * description) and finally to a generic placeholder. This keeps a freshly
 * cloned site working with zero config while letting anyone override every
 * value from Admin → Landing page → SEO & identity.
 */
export async function getSeo(): Promise<ResolvedSeo> {
  const [seo, navbar, hero] = await Promise.all([
    getSiteContent('seo'),
    getSiteContent('navbar'),
    getSiteContent('hero'),
  ])

  const brand = [navbar.brandName, navbar.brandTag].map((s) => s?.trim()).filter(Boolean).join(' ')
  const heroName = [hero.name, hero.lastName].map((s) => s?.trim()).filter(Boolean).join(' ')

  const siteName = seo.siteName?.trim() || brand || heroName || GENERIC_SEO.siteName
  const author = seo.author?.trim() || siteName
  const role = seo.role?.trim() || hero.title?.trim() || GENERIC_SEO.role
  const tagline = seo.tagline?.trim() || hero.description?.trim() || GENERIC_SEO.tagline

  const siteUrl = getSiteUrl()
  const domain = siteUrl.replace(/^https?:\/\//i, '').replace(/\/+$/, '')

  return { siteName, author, tagline, role, siteUrl, domain }
}
