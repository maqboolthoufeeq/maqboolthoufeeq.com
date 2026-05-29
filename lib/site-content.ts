import { prisma } from './prisma'

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
  contact: boolean
  blogArchive: boolean
}

export interface AnalyticsContent {
  /** Show the unique-visitor count in the public landing-page footer. */
  showVisitors: boolean
  /** Show the total page-view count in the public landing-page footer. */
  showPageViews: boolean
}

const DEFAULTS = {
  navbar: {
    brandName: 'Maqbool Thoufeeq',
    brandTag: 'Tharayil',
    links: [
      { href: '/#about', label: 'About' },
      { href: '/#projects', label: 'Projects' },
      { href: '/blog', label: 'Blog' },
      { href: '/#contact', label: 'Contact' },
    ],
  } satisfies NavbarContent,

  hero: {
    greeting: "Hello, I'm",
    name: 'Maqbool Thoufeeq',
    lastName: 'Tharayil',
    title: 'Full-Stack Developer',
    description: 'I build fast, beautiful web products — from polished frontends to scalable backend systems.',
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
      "I'm a Full-Stack Developer with a passion for crafting performant, accessible web experiences. I love the full spectrum — from pixel-perfect UIs to robust APIs and database design.",
      "When I'm not coding, you'll find me exploring new technologies, contributing to open source, or writing about what I've learned on my blog.",
    ],
    skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Prisma', 'Tailwind CSS', 'Docker', 'AWS', 'Git'],
  } satisfies AboutContent,

  contact: {
    description: "I'm always open to interesting projects and opportunities. Whether you have a question or just want to say hi — feel free to reach out.",
    email: '',
    phone: '',
    address: '',
    extra: [] as ContactExtra[],
    links: [
      { href: 'mailto:maqboolthoufeeq@gmail.com', label: 'Email' },
      { href: 'https://github.com/maqboolthoufeeq', label: 'GitHub' },
      { href: 'https://linkedin.com/in/maqboolthoufeeq', label: 'LinkedIn' },
    ],
  } satisfies ContactContent,

  footer: {
    copyrightName: 'Maqbool Thoufeeq',
  } satisfies FooterContent,

  sections: {
    hero: true as boolean,
    about: true as boolean,
    projects: true as boolean,
    blogPreview: true as boolean,
    contact: true as boolean,
    blogArchive: true as boolean,
  } satisfies SectionVisibility,

  analytics: {
    showVisitors: false as boolean,
    showPageViews: false as boolean,
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
