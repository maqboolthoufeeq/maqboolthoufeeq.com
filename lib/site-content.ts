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
}

export interface SectionVisibility {
  hero: boolean
  about: boolean
  projects: boolean
  blogPreview: boolean
  socialMedia: boolean
  contact: boolean
  blogArchive: boolean
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
  } satisfies FooterContent,

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
    contact: true as boolean,
    blogArchive: true as boolean,
  } satisfies SectionVisibility,

  analytics: {
    showVisitors: false as boolean,
    showPageViews: false as boolean,
    showBlogStats: false as boolean,
  } satisfies AnalyticsContent,
}

type ContentKey = keyof typeof DEFAULTS
type ContentValue<K extends ContentKey> = (typeof DEFAULTS)[K]

export async function getSiteContent<K extends ContentKey>(key: K): Promise<ContentValue<K>> {
  const row = await prisma.siteContent.findUnique({ where: { key } })
  if (!row) {
    await prisma.siteContent.create({ data: { key, value: DEFAULTS[key] as object } })
    return DEFAULTS[key]
  }
  return { ...DEFAULTS[key], ...(row.value as object) } as ContentValue<K>
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
